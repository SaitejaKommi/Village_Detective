import 'dotenv/config'
import path from 'node:path'

export const config = {
  port: Number(process.env.PORT ?? 8080),
  tickMs: Number(process.env.TICK_MS ?? 1000),
  dbPath: process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'village.db'),
  dataDir: process.env.DATA_DIR ?? path.join(process.cwd(), 'data'),
  groqApiKey: process.env.GROQ_API_KEY ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  groqModel: process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
  debugAgents: process.env.DEBUG_AGENTS === 'true',
}
