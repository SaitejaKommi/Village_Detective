import type { WebSocket } from 'ws'

export type Connection = {
  id: string
  socket: WebSocket
  playerId?: string
  sessionId?: string
  caseRunId?: string
  lastTalkAt: number
  lastHintAt: number
}
