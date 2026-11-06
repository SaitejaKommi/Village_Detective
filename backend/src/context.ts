import type Database from 'better-sqlite3'
import type { Difficulty, RoomState } from '../../shared/types'
import type { Persona } from './agents/persona'
import type { DifficultyConfig } from './game/difficulty'
import type { GameSession } from './game/session'
import type { LLMProvider } from './llm/provider'
import type { LLMQueue } from './llm/queue'
import type { Connection } from './net/connection'

export type GameContext = {
  db: Database.Database
  dataDir: string
  port: number
  tickMs: number
  debugAgents: boolean
  rooms: RoomState[]
  personas: Map<string, Persona>
  difficulties: Map<Difficulty, DifficultyConfig>
  llm: LLMProvider
  queue: LLMQueue
  sessions: Map<string, GameSession>
  connections: Set<Connection>
}
