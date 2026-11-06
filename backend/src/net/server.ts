import { randomUUID } from 'node:crypto'
import { WebSocketServer } from 'ws'
import type { GameContext } from '../context'
import { tickSessions } from '../game/tick'
import type { Connection } from './connection'
import { handleMessage } from './handlers'

export function createServer(ctx: GameContext): WebSocketServer {
  const wss = new WebSocketServer({ port: ctx.port })

  wss.on('connection', (socket) => {
    const conn: Connection = {
      id: randomUUID(),
      socket,
      lastTalkAt: 0,
      lastHintAt: 0,
    }
    ctx.connections.add(conn)

    socket.on('message', (data) => {
      void handleMessage(ctx, conn, data.toString())
    })
    socket.on('close', () => {
      ctx.connections.delete(conn)
    })
    socket.on('error', () => {
      ctx.connections.delete(conn)
    })
  })

  const timer = setInterval(() => tickSessions(ctx), ctx.tickMs)
  wss.on('close', () => clearInterval(timer))

  return wss
}
