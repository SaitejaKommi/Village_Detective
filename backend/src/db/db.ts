import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

export type DB = Database.Database

export function openDatabase(dbPath: string): DB {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      diamonds INTEGER NOT NULL DEFAULT 3,
      cases_solved INTEGER NOT NULL DEFAULT 0,
      outfit_id TEXT NOT NULL DEFAULT 'default',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS case_runs (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      result TEXT NOT NULL DEFAULT 'in_progress',
      hints_used INTEGER NOT NULL DEFAULT 0,
      reward_granted INTEGER NOT NULL DEFAULT 0,
      started_at INTEGER NOT NULL,
      ended_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS hint_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_run_id TEXT NOT NULL,
      tier TEXT NOT NULL,
      cost INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_run_id TEXT NOT NULL,
      npc_id TEXT NOT NULL,
      speaker TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_case_runs_player ON case_runs(player_id);
    CREATE INDEX IF NOT EXISTS idx_hint_log_run ON hint_log(case_run_id);
    CREATE INDEX IF NOT EXISTS idx_transcripts_run ON transcripts(case_run_id);
  `)
}
