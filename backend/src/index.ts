import { config } from './config'
import type { GameContext } from './context'
import { openDatabase } from './db/db'
import { loadDifficulty } from './game/difficulty'
import { loadPersonas } from './game/personas'
import { loadWorldData } from './game/worldLoader'
import { FallbackProvider, ScriptedProvider } from './llm/fallback'
import { GeminiProvider } from './llm/gemini'
import { GroqProvider } from './llm/groq'
import { LLMQueue } from './llm/queue'
import { createServer } from './net/server'

const db = openDatabase(config.dbPath)

const llm = new FallbackProvider([
  new GroqProvider(config.groqApiKey, config.groqModel),
  new GeminiProvider(config.geminiApiKey, config.geminiModel),
  new ScriptedProvider(),
])

const context: GameContext = {
  db,
  dataDir: config.dataDir,
  port: config.port,
  tickMs: config.tickMs,
  debugAgents: config.debugAgents,
  rooms: loadWorldData(config.dataDir),
  personas: loadPersonas(config.dataDir),
  difficulties: loadDifficulty(config.dataDir),
  llm,
  queue: new LLMQueue(200),
  sessions: new Map(),
  connections: new Set(),
}

createServer(context)

console.log(`Village of Liars backend listening on ws://localhost:${config.port}`)
