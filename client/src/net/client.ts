import { bus, clueTitle, store } from '../state/store';
import { loadPlayerId, savePlayerId } from '../settings';
import type { ClientMessage, ServerMessage, ServerMsg, ServerType } from './protocol';
import { createTransport, USE_MOCK, type Transport } from './transport';

export interface LogEntry { dir: 'in' | 'out'; type: string; t: number }

/** Typed game client. Works the same over the mock and the real WebSocket (flat messages). */
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
      if (s === 'online') {
        // Resume the running case after a dropped socket. Otherwise start clean.
        const resume = store.state.caseInfo && !store.state.gameOver ? store.state.sessionId ?? undefined : undefined;
        this.send({ type: 'join', playerId: store.state.playerId ?? loadPlayerId(), sessionId: resume });
      }
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

  /**
   * The server allows one case per session, so every new case starts on a fresh session:
   * join with the playerId and no sessionId, and wait for the `session` reply.
   */
  newSession(): Promise<void> {
    return new Promise((resolve) => {
      const off = this.on('session', () => { off(); window.clearTimeout(t); resolve(); });
      const t = window.setTimeout(() => { off(); resolve(); }, 6000);
      store.set({ sessionId: null });
      this.send({ type: 'join', playerId: store.state.playerId ?? loadPlayerId() });
    });
  }

  retry(): void {
    const t = this.transport as (Transport & { retry?: () => void }) | null;
    if (t?.retry) t.retry();
    else t?.connect();
  }

  /** Typed subscription to a server message type. The handler receives the whole flat message. */
  on<T extends ServerType>(type: T, fn: (msg: ServerMsg<T>) => void): () => void {
    return bus.on(`net:${type}`, fn);
  }

  private handle(msg: ServerMessage): void {
    this.log.push({ dir: 'in', type: msg.type, t: Date.now() });
    if (this.log.length > 60) this.log.shift();
    switch (msg.type) {
      case 'session':
        savePlayerId(msg.playerId);
        store.set({ playerId: msg.playerId, sessionId: msg.sessionId });
        this.send({ type: 'get_profile' }); // the server does not push the profile on join
        break;
      case 'profile':
        store.set({ profile: msg, diamonds: msg.diamonds, playerId: msg.playerId });
        break;
      case 'case_started':
        store.resetCase();
        store.set({ caseInfo: msg });
        break;
      case 'state': {
        // Clues the server marks discovered carry their text. That is what the notebook lists.
        const found = msg.clues
          .filter((c) => c.discovered && c.text)
          .map((c) => ({ id: c.id, title: clueTitle(c.id), text: c.text as string, room: c.roomId }));
        const prev = store.state.foundClues;
        const same = prev.length === found.length && prev.every((p, i) => p.id === found[i].id);
        store.set({ world: msg, ...(same ? {} : { foundClues: found }) });
        break;
      }
      case 'npc_say':
        store.addLine(msg.npcId, { who: 'npc', text: msg.text, at: Date.now() });
        break;
      case 'hint':
        store.set({
          diamonds: msg.diamonds,
          hintsLeft: msg.hintsLeft,
          hints: [...store.state.hints, { tier: msg.tier, text: msg.text }],
        });
        break;
      case 'diamonds_update':
        store.set({ diamonds: msg.balance });
        break;
      case 'game_over':
        store.set({ gameOver: msg, accused: true });
        break;
      default:
        break;
    }
    bus.emit(`net:${msg.type}`, msg);
  }
}

export const net = new GameClient();
