import type { GameContext } from '../context'
import { sendState } from '../net/broadcast'
import { runAmbient } from './engine'

export function tickSessions(ctx: GameContext): void {
  for (const session of ctx.sessions.values()) {
    if (!session.caseFile || session.solved) continue
    session.world.tick += 1
    session.world.clock += 1
    runAmbient(ctx, session)
    sendState(ctx, session)
  }
}
