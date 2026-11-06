import type { ServerMessage } from '../../../shared/types'
import type { GameContext } from '../context'
import type { GameSession } from '../game/session'
import type { Connection } from './connection'

export function send(conn: Connection, message: ServerMessage): void {
  if (conn.socket.readyState === 1) conn.socket.send(JSON.stringify(message))
}

export function sendToSession(
  ctx: GameContext,
  sessionId: string,
  message: ServerMessage,
): void {
  for (const conn of ctx.connections) {
    if (conn.sessionId !== sessionId) continue
    send(conn, message)
  }
}

export function sendState(ctx: GameContext, session: GameSession): void {
  sendToSession(ctx, session.id, { type: 'state', ...session.world.toState() })
}
