import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { Briefing, RoomState, SuspectInfo } from '../../../shared/types'
import { Agent } from '../agents/agent'
import type { Persona } from '../agents/persona'
import type { World } from '../world/world'
import { placeClues } from './clues'
import type { DifficultyConfig } from './difficulty'

const TimelineEntrySchema = z.object({
  time: z.number(),
  place: z.string(),
  actorId: z.string(),
  text: z.string(),
})

const ClueSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  text: z.string(),
  relatedTo: z.string().optional(),
  visibility: z.enum(['low', 'medium', 'high']).default('medium'),
})

const RedHerringSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  text: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
})

const NpcSeedSchema = z.object({
  npcId: z.string(),
  memories: z.array(z.string()).default([]),
})

const HintTemplateSchema = z.object({
  tier: z.enum(['direction', 'location', 'contradiction']),
  template: z.string(),
})

export const CaseFileSchema = z.object({
  caseId: z.string(),
  title: z.string(),
  victimId: z.string(),
  killerId: z.string(),
  scene: z.string(),
  summary: z.string(),
  coverStory: z.string(),
  timeline: z.array(TimelineEntrySchema).default([]),
  clues: z.array(ClueSchema).default([]),
  npcSeeds: z.array(NpcSeedSchema).default([]),
  redHerrings: z.array(RedHerringSchema).default([]),
  hintTemplates: z.array(HintTemplateSchema).default([]),
})

export type CaseFile = z.infer<typeof CaseFileSchema>
export type BuiltCase = {
  briefing: Briefing
  suspects: SuspectInfo[]
  rooms: RoomState[]
  agents: Map<string, Agent>
}

export function loadCaseFile(dataDir: string): CaseFile {
  const raw = JSON.parse(fs.readFileSync(path.join(dataDir, 'case.json'), 'utf8')) as unknown
  return CaseFileSchema.parse(raw)
}

export function buildCase(
  world: World,
  caseFile: CaseFile,
  difficulty: DifficultyConfig,
  personas: Map<string, Persona>,
  rooms: RoomState[],
  playerId: string,
): BuiltCase {
  world.reset()
  world.loadRooms(rooms)
  world.activeCaseId = caseFile.caseId

  for (const event of caseFile.timeline) {
    world.truth.append({
      t: event.time,
      kind: 'murder',
      text: event.text,
      actorId: event.actorId,
    })
  }

  const agents = new Map<string, Agent>()
  const suspects: SuspectInfo[] = []
  let roomIndex = 0

  for (const persona of personas.values()) {
    if (persona.id === caseFile.victimId) continue

    const agent = new Agent(persona, difficulty)
    for (const memory of persona.seedMemories) agent.memory.add(memory, 0, 2)
    const seeds = caseFile.npcSeeds.find((seed) => seed.npcId === persona.id)
    for (const memory of seeds?.memories ?? []) agent.memory.add(memory, 0, 3)
    agents.set(persona.id, agent)

    const room = rooms[roomIndex % rooms.length]
    roomIndex += 1
    world.npcs.set(persona.id, {
      id: persona.id,
      personaId: persona.id,
      name: persona.name,
      roomId: room.id,
      position: { x: 1 + (roomIndex % 4), y: 1 + (roomIndex % 3) },
    })

    suspects.push({
      id: persona.id,
      name: persona.name,
      role: persona.role,
      portraitId: persona.portraitId,
    })
  }

  const killer = agents.get(caseFile.killerId)
  if (killer) killer.memory.add(caseFile.coverStory, 0, 5)

  placeClues(world, caseFile, difficulty)

  world.player = {
    id: playerId,
    roomId: rooms[0].id,
    position: { x: 0, y: 0 },
  }

  return {
    briefing: {
      title: caseFile.title,
      victimId: caseFile.victimId,
      victimName: personas.get(caseFile.victimId)?.name ?? caseFile.victimId,
      scene: caseFile.scene,
      summary: caseFile.summary,
    },
    suspects,
    rooms,
    agents,
  }
}
