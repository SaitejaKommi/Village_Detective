import { z } from 'zod'

export const RelationshipSchema = z.object({
  npcId: z.string(),
  attitude: z.string(),
  knowsAbout: z.string().optional(),
})

export const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  appearance: z.string(),
  voiceStyle: z.string(),
  goal: z.string(),
  secret: z.string(),
  motiveToLie: z.string(),
  relationships: z.array(RelationshipSchema).default([]),
  seedMemories: z.array(z.string()).default([]),
  portraitId: z.string().optional(),
  spriteColor: z.string().optional(),
})

export type Persona = z.infer<typeof PersonaSchema>
export type Relationship = z.infer<typeof RelationshipSchema>
