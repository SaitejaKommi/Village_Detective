import type { DB } from './db'

export type TranscriptRow = {
  id: number
  case_run_id: string
  npc_id: string
  speaker: string
  text: string
  created_at: number
}

export function insertTranscript(
  db: DB,
  caseRunId: string,
  npcId: string,
  speaker: 'player' | 'npc',
  text: string,
): void {
  db.prepare(
    'INSERT INTO transcripts (case_run_id, npc_id, speaker, text, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(caseRunId, npcId, speaker, text, Date.now())
}

export function listTranscripts(db: DB, caseRunId: string): TranscriptRow[] {
  return db
    .prepare('SELECT * FROM transcripts WHERE case_run_id = ? ORDER BY id ASC')
    .all(caseRunId) as TranscriptRow[]
}
