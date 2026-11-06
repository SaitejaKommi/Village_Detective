import { randomUUID } from 'node:crypto'
import { STARTING_DIAMONDS } from '../../../shared/types'
import type { DB } from './db'

export type PlayerRow = {
  id: string
  diamonds: number
  cases_solved: number
  outfit_id: string
  created_at: number
}

export function getPlayer(db: DB, id: string): PlayerRow | undefined {
  return db
    .prepare('SELECT id, diamonds, cases_solved, outfit_id, created_at FROM players WHERE id = ?')
    .get(id) as PlayerRow | undefined
}

export function createPlayer(db: DB, id: string): PlayerRow {
  db.prepare(
    'INSERT INTO players (id, diamonds, cases_solved, outfit_id, created_at) VALUES (?, ?, 0, ?, ?)',
  ).run(id, STARTING_DIAMONDS, 'default', Date.now())
  return getPlayer(db, id) as PlayerRow
}

export function ensurePlayer(db: DB, id?: string): PlayerRow {
  if (id) {
    const existing = getPlayer(db, id)
    if (existing) return existing
  }
  return createPlayer(db, id ?? randomUUID())
}

export function deductDiamond(db: DB, id: string): boolean {
  const result = db
    .prepare('UPDATE players SET diamonds = diamonds - 1 WHERE id = ? AND diamonds >= 1')
    .run(id)
  return result.changes === 1
}
