import type { HintTier } from '../../../shared/types'
import type { DB } from './db'

export function logHint(db: DB, caseRunId: string, tier: HintTier, cost: number): void {
  db.prepare('INSERT INTO hint_log (case_run_id, tier, cost, created_at) VALUES (?, ?, ?, ?)').run(
    caseRunId,
    tier,
    cost,
    Date.now(),
  )
}

export function countHints(db: DB, caseRunId: string): number {
  const row = db.prepare('SELECT COUNT(*) AS count FROM hint_log WHERE case_run_id = ?').get(caseRunId) as {
    count: number
  }
  return row.count
}
