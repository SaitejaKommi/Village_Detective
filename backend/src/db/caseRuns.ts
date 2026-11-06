import type { Difficulty } from '../../../shared/types'
import type { DB } from './db'

export type CaseRunRow = {
  id: string
  player_id: string
  case_id: string
  difficulty: Difficulty
  result: 'won' | 'lost' | 'in_progress'
  hints_used: number
  reward_granted: number
  started_at: number
  ended_at: number | null
}

export function createCaseRun(
  db: DB,
  id: string,
  playerId: string,
  caseId: string,
  difficulty: Difficulty,
): void {
  db.prepare(
    'INSERT INTO case_runs (id, player_id, case_id, difficulty, result, started_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, playerId, caseId, difficulty, 'in_progress', Date.now())
}

export function getCaseRun(db: DB, id: string): CaseRunRow | undefined {
  return db.prepare('SELECT * FROM case_runs WHERE id = ?').get(id) as CaseRunRow | undefined
}

export function markLost(db: DB, id: string): void {
  db.prepare("UPDATE case_runs SET result = 'lost', ended_at = ? WHERE id = ? AND result = 'in_progress'").run(
    Date.now(),
    id,
  )
}

export function markWon(db: DB, id: string): void {
  db.prepare("UPDATE case_runs SET result = 'won', ended_at = ? WHERE id = ? AND result = 'in_progress'").run(
    Date.now(),
    id,
  )
}

export function grantReward(db: DB, runId: string, playerId: string, amount: number): boolean {
  const transaction = db.transaction(() => {
    const marked = db
      .prepare(
        "UPDATE case_runs SET result = 'won', reward_granted = 1, ended_at = ? WHERE id = ? AND reward_granted = 0 AND result = 'in_progress'",
      )
      .run(Date.now(), runId)
    if (marked.changes !== 1) return false

    db.prepare(
      'UPDATE players SET diamonds = diamonds + ?, cases_solved = cases_solved + 1 WHERE id = ?',
    ).run(amount, playerId)
    return true
  })

  return transaction()
}

export function incrementHints(db: DB, id: string): void {
  db.prepare('UPDATE case_runs SET hints_used = hints_used + 1 WHERE id = ?').run(id)
}
