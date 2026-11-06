import { bus, store } from '../state/store';
import { loadPlayerId, savePlayerId } from '../settings';
import type { ClientMessage, ServerMessage, ServerPayload, ServerType } from './protocol';
import { createTransport, USE_MOCK, type Transport } from './transport';

export interface LogEntry { dir: 'in' | 'out'; type: string; t: number }

/** Typed game client. Works the same over the mock and the real WebSocket. */
class GameClient {
  private transport: Transport | null = null;
  readonly log: LogEntry[] = [];
  readonly usingMock = USE_MOCK;

  async init(): Promise<void> {
    if (this.transport) return;
    const t = await createTransport();
    this.transport = t;
    t.onStatus((s) => {
      store.set({ connection: s });
      if (s === 'online') this.send({ type: 'join', payload: { playerId: loadPlayerId() } });
    });
    t.onMessage((m) => this.handle(m));
    t.connect();
  }

  send(msg: ClientMessage): void {
    if (msg.type !== 'move') {
      this.log.push({ dir: 'out', type: msg.type, t: Date.now() });
      if (this.log.length > 60) this.log.shift();
    }
    this.transport?.send(msg);
  }

  retry(): void {
    const t = this.transport as (Transport & { retry?: () => void }) | null;
    if (t?.retry) t.retry();
    else t?.connect();
  }

  /** Typed subscription to a server message type. Returns an unsubscribe function. */
  on<T extends ServerType>(type: T, fn: (payload: ServerPayload<T>) => void): () => void {
    return bus.on(`net:${type}`, fn);
  }

  private handle(msg: ServerMessage): void {
    this.log.push({ dir: 'in', type: msg.type, t: Date.now() });
    if (this.log.length > 60) this.log.shift();
    switch (msg.type) {
      case 'session':
        if (msg.payload.playerId) { savePlayerId(msg.payload.playerId); store.set({ playerId: msg.payload.playerId }); }
        break;
      case 'profile':
        store.set({ profile: msg.payload, diamonds: msg.payload.diamonds, playerId: msg.payload.playerId });
        savePlayerId(msg.payload.playerId);
        break;
      case 'case_started':
        store.resetCase();
        store.set({ caseInfo: msg.payload });
        break;
      case 'state':
        store.set({ world: msg.payload });
        break;
      case 'npc_say':
        store.addLine(msg.payload.npcId, { who: 'npc', text: msg.payload.text, at: Date.now() });
        break;
      case 'clue_info': {
        const p = msg.payload;
        if (!store.state.foundClues.some((c) => c.id === p.clueId)) {
          store.set({ foundClues: [...store.state.foundClues, { id: p.clueId, title: p.title, text: p.text, room: p.room }] });
        }
        break;
      }
      case 'hint':
        store.set({
          diamonds: msg.payload.diamonds,
          hintsLeft: msg.payload.hintsLeft,
          hints: [...store.state.hints, { tier: msg.payload.tier, text: msg.payload.text }],
        });
        break;
      case 'diamonds_update':
        store.set({ diamonds: msg.payload.balance });
        break;
      case 'game_over':
        store.set({ gameOver: msg.payload, diamonds: msg.payload.diamonds, accused: true });
        break;
      default:
        break;
    }
    bus.emit(`net:${msg.type}`, msg.payload);
  }
}

export const net = new GameClient();
