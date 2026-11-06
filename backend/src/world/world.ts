import type {
  NpcState,
  PlayerState,
  Position,
  RoomState,
  StateMessage,
} from '../../../shared/types'
import { TruthLog } from './truthLog'

export type NpcEntity = {
  id: string
  personaId: string
  name: string
  roomId: string
  position: Position
  mood?: string
}

export type ClueEntity = {
  id: string
  roomId: string
  text: string
  discovered: boolean
  relatedTo?: string
}

export class World {
  tick = 0
  clock = 0
  activeCaseId: string | null = null
  player: PlayerState | null = null
  readonly rooms = new Map<string, RoomState>()
  readonly npcs = new Map<string, NpcEntity>()
  readonly clues = new Map<string, ClueEntity>()
  readonly truth = new TruthLog()

  reset(): void {
    this.tick = 0
    this.clock = 0
    this.activeCaseId = null
    this.player = null
    this.rooms.clear()
    this.npcs.clear()
    this.clues.clear()
  }

  loadRooms(rooms: RoomState[]): void {
    for (const room of rooms) this.rooms.set(room.id, room)
  }

  roomOf(entityId: string): string | null {
    if (this.player?.id === entityId) return this.player.roomId
    return this.npcs.get(entityId)?.roomId ?? null
  }

  npc(id: string): NpcEntity | undefined {
    return this.npcs.get(id)
  }

  npcsInRoom(roomId: string): NpcEntity[] {
    return [...this.npcs.values()].filter((npc) => npc.roomId === roomId)
  }

  adjacentRooms(roomId: string): RoomState[] {
    const room = this.rooms.get(roomId)
    if (!room) return []
    return room.adjacent.flatMap((id) => {
      const adjacent = this.rooms.get(id)
      return adjacent ? [adjacent] : []
    })
  }

  moveNpc(npcId: string, roomId: string): boolean {
    const npc = this.npcs.get(npcId)
    if (!npc || !this.rooms.has(roomId)) return false
    npc.roomId = roomId
    return true
  }

  toState(): Omit<StateMessage, 'type'> {
    return {
      tick: this.tick,
      clock: this.clock,
      player: this.player ?? { id: '', roomId: '', position: { x: 0, y: 0 } },
      npcs: [...this.npcs.values()].map((npc): NpcState => ({
        id: npc.id,
        name: npc.name,
        roomId: npc.roomId,
        position: npc.position,
        mood: npc.mood,
      })),
      clues: [...this.clues.values()].map((clue) => ({
        id: clue.id,
        roomId: clue.roomId,
        discovered: clue.discovered,
        text: clue.discovered ? clue.text : undefined,
      })),
    }
  }
}
