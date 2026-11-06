// MOCK SERVER. Implements the message contract in-browser behind the same Transport interface
// as the real WebSocket client. Loaded lazily, only when VITE_USE_MOCK is not "false".
//
// The mock plays the part of the server, so it is allowed to "know" the solution. It picks the killer at
// random in start_case and keeps it private until game_over. The pretend-server diamond balance lives in
// localStorage here and nowhere else: UI code never reads or writes it.
import type {
  CaseStartedPayload, ClientMessage, ConnectionStatus, Difficulty, ErrorPayload, ProfilePayload,
  ServerMessage, WorldState,
} from '../net/protocol';
import type { Transport } from '../net/transport';
import { NPCS, SUSPECT_IDS, VICTIM_ID, type NpcId } from '../data/npcs';
import { roomAt, roomCenter, ROOM_BY_ID, roomName, routeBetween, ROOMS } from '../data/mansion';
import { NEUTRAL_CLUES, SCRIPTS, TRUE_TIMELINE_HEAD, TRUE_TIMELINE_TAIL } from './script';

const TICK_MS = 500;
const STORE_KEY = 'vol.mock.server';
const START_DIAMONDS = 3;
const HINT_COST = 1;
const CONFIG: Record<Difficulty, { maxHints: number; reward: number }> = {
  easy: { maxHints: 4, reward: 1 },
  medium: { maxHints: 3, reward: 2 },
  hard: { maxHints: 1, reward: 3 },
};

interface PlayerRow { diamonds: number; casesSolved: number; outfitId: string }

// ---- pretend database (inside the mock only) ---------------------------------
let memoryDb: Record<string, PlayerRow> = {};
function readDb(): Record<string, PlayerRow> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, PlayerRow>;
  } catch { /* fall through */ }
  return memoryDb;
}
function writeDb(db: Record<string, PlayerRow>): void {
  memoryDb = db;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch { /* ignore */ }
}
function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'p-' + Math.random().toString(36).slice(2, 10);
}

interface MockNpc {
  id: NpcId; x: number; y: number; room: string;
  route: { x: number; y: number }[]; restUntil: number;
}
interface MockClue { id: string; room: string; x: number; y: number; label: string; title: string; text: string }

const SPOTS: Record<string, [number, number][]> = {
  study: [[11.5, 9.5], [4.5, 8.5], [12.5, 4.5]],
  library: [[12.5, 9.5], [3.5, 3.5], [12.5, 4.5]],
  kitchen: [[3.5, 9.5], [12.5, 4.5], [5.5, 3.5]],
  dining: [[3.5, 9.5], [12.5, 3.5], [3.5, 4.5]],
  foyer: [[3.5, 9.5], [12.5, 4.5], [13.5, 8.5]],
  garden: [[3.5, 4.5], [4.5, 7.5], [6.5, 10.5]],
};
const OFFSETS: Record<string, [number, number]> = {
  evelyn: [-2, -1.5], julian: [2, -1.5], harold: [-2, 1.5], margaret: [2, 1.5], victor: [0, -2.5],
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let current: MockTransport | null = null;

export class MockTransport implements Transport {
  private msgCb: (m: ServerMessage) => void = () => {};
  private statusCb: (s: ConnectionStatus) => void = () => {};
  private playerId = '';
  private online = false;

  // private case state (the "truth")
  private active = false;
  private difficulty: Difficulty = 'easy';
  private killer: NpcId = 'evelyn';
  private hintsUsed = 0;
  private lastHintAt = 0;
  private accusedAlready = false;
  private npcs: MockNpc[] = [];
  private clues: MockClue[] = [];
  private lastTalk: Record<string, number> = {};
  private genericIdx: Record<string, number> = {};
  private tick = 0;
  private clock = 22 * 60 + 50;
  private timer: number | undefined;

  constructor() { current = this; }

  onMessage(cb: (m: ServerMessage) => void): void { this.msgCb = cb; }
  onStatus(cb: (s: ConnectionStatus) => void): void { this.statusCb = cb; }

  connect(): void {
    this.statusCb('connecting');
    window.setTimeout(() => { this.online = true; this.statusCb('online'); }, 250);
  }
  close(): void { window.clearInterval(this.timer); this.online = false; }

  /** Debug helper: drop the connection for a few seconds to show the reconnect banner. */
  simulateDisconnect(ms = 4000): void {
    this.online = false;
    this.statusCb('reconnecting');
    window.setTimeout(() => { this.online = true; this.statusCb('online'); }, ms);
  }

  private reply(m: ServerMessage, delay = 0): void {
    window.setTimeout(() => { if (this.online) this.msgCb(m); }, delay);
  }
  private error(code: string, message?: string): void {
    const payload: ErrorPayload = { code, message };
    this.reply({ type: 'error', payload });
  }

  // ---- inbound ------------------------------------------------------------
  send(msg: ClientMessage): void {
    if (!this.online) return;
    switch (msg.type) {
      case 'join': return this.onJoin(msg.payload.playerId);
      case 'get_profile': return this.sendProfile();
      case 'start_case': return this.onStartCase(msg.payload.difficulty);
      case 'move': return; // client simulates movement locally; the mock ignores input
      case 'talk': return this.onTalk(msg.payload.npcId, msg.payload.text);
      case 'inspect': return this.onInspect(msg.payload.clueId);
      case 'hint_request': return this.onHint();
      case 'accuse': return this.onAccuse(msg.payload.npcId);
      default: return this.error('BAD_REQUEST', 'Unknown message');
    }
  }

  private row(): PlayerRow {
    const db = readDb();
    return db[this.playerId];
  }
  private save(row: PlayerRow): void {
    const db = readDb();
    db[this.playerId] = row;
    writeDb(db);
  }

  private onJoin(playerId?: string): void {
    const db = readDb();
    if (playerId && db[playerId]) this.playerId = playerId;
    else {
      this.playerId = uuid();
      db[this.playerId] = { diamonds: START_DIAMONDS, casesSolved: 0, outfitId: 'default' };
      writeDb(db);
    }
    this.reply({ type: 'session', payload: { sessionId: 'mock-' + uuid().slice(0, 8), playerId: this.playerId } });
    this.sendProfile();
  }

  private sendProfile(): void {
    if (!this.playerId) return this.error('NO_SESSION', 'Join first');
    const r = this.row();
    const payload: ProfilePayload = {
      playerId: this.playerId, diamonds: r.diamonds, casesSolved: r.casesSolved, outfitId: r.outfitId,
    };
    this.reply({ type: 'profile', payload });
  }

  private onStartCase(difficulty: Difficulty): void {
    if (!this.playerId) return this.error('NO_SESSION', 'Join first');
    if (!(difficulty in CONFIG)) return this.error('BAD_REQUEST', 'Unknown difficulty');
    this.difficulty = difficulty;
    this.killer = pick(SUSPECT_IDS);
    this.hintsUsed = 0;
    this.accusedAlready = false;
    this.active = true;
    this.tick = 0;
    this.clock = 22 * 60 + 50;
    this.lastTalk = {};
    this.buildClues();
    this.npcs = SUSPECT_IDS.map((id) => {
      const c = roomCenter(ROOM_BY_ID[NPCS[id].home]);
      const [ox, oy] = OFFSETS[id];
      return { id, x: c.x + ox, y: c.y + oy, room: NPCS[id].home, route: [], restUntil: rand(2, 8) };
    });
    const payload: CaseStartedPayload = {
      caseId: 'blackwood-manor',
      title: 'The Blackwood Manor Murder',
      difficulty,
      briefing: {
        victimId: VICTIM_ID,
        victimName: NPCS[VICTIM_ID].name,
        scene:
          'Blackwood Manor, a stormy night. Alistair Blackwood was found dead in his study shortly before eleven. ' +
          'The doors were bolted against the rain. Whoever did it is still under this roof.',
        summary:
          'Five people were in the house. Each of them has something to hide, and not every secret is about the murder. ' +
          'Question them, search the rooms, and name the killer.',
      },
      rooms: ROOMS.map((r) => ({ id: r.id, name: r.name })),
      suspects: SUSPECT_IDS.map((id) => ({
        id, name: NPCS[id].name, role: NPCS[id].role, appearance: NPCS[id].appearance,
      })),
    };
    this.reply({ type: 'case_started', payload }, 350);
    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.onTick(), TICK_MS);
  }

  private buildClues(): void {
    const used: Record<string, number> = {};
    const place = (room: string): [number, number] => {
      const i = (used[room] = (used[room] ?? -1) + 1);
      const [lx, ly] = SPOTS[room][i % SPOTS[room].length];
      const r = ROOM_BY_ID[room];
      return [r.col * 16 + lx, r.row * 12 + ly];
    };
    const list: MockClue[] = [];
    for (const n of NEUTRAL_CLUES) {
      const [x, y] = place(n.room);
      list.push({ id: n.id, room: n.room, x, y, label: n.label, title: n.title, text: n.text });
    }
    for (const id of SUSPECT_IDS) {
      const s = SCRIPTS[id];
      const useDamning = id === this.killer;
      const c = useDamning ? s.damning : s.herring;
      const [x, y] = place(c.room);
      list.push({ id: `c_${id}`, room: c.room, x, y, label: useDamning ? 'Evidence' : 'Item', title: c.title, text: c.text });
    }
    this.clues = list;
  }

  private onTick(): void {
    this.tick++;
    if (this.tick % 2 === 0) this.clock += 1;
    const now = this.tick * (TICK_MS / 1000);
    for (const n of this.npcs) {
      const talking = now - (this.lastTalk[n.id] ?? -99) < 18;
      if (talking) continue;
      if (n.route.length === 0 && now >= n.restUntil) {
        const dest = pick(ROOMS.filter((r) => r.id !== n.room)).id;
        const [ox, oy] = OFFSETS[n.id];
        const c = roomCenter(ROOM_BY_ID[dest]);
        n.route = [...routeBetween(roomAt(n.x, n.y), dest), { x: c.x + ox, y: c.y + oy }];
        n.restUntil = now + rand(6, 16);
      }
      const t = n.route[0];
      if (t) {
        const dx = t.x - n.x, dy = t.y - n.y, d = Math.hypot(dx, dy);
        const step = 1.0;
        if (d <= step) { n.x = t.x; n.y = t.y; n.route.shift(); }
        else { n.x += (dx / d) * step; n.y += (dy / d) * step; }
        n.room = roomAt(n.x, n.y);
      }
    }
    const done = this.clues; // all clues are always present in the world
    const payload: WorldState = {
      tick: this.tick,
      clock: this.clock,
      npcs: this.npcs.map((n) => ({ id: n.id, room: n.room, x: +n.x.toFixed(2), y: +n.y.toFixed(2) })),
      clues: done.map((c) => ({ id: c.id, room: c.room, x: c.x, y: c.y, label: c.label })),
    };
    this.msgCb({ type: 'state', payload });
  }

  private onTalk(npcId: string, textRaw: string): void {
    if (!this.active) return this.error('NO_ACTIVE_CASE');
    const text = String(textRaw ?? '').trim();
    if (!SUSPECT_IDS.includes(npcId as NpcId)) return this.error('NPC_UNAVAILABLE', 'No one by that name can answer.');
    if (text.length < 1 || text.length > 300) return this.error('BAD_REQUEST', 'Say something, in 300 characters or fewer.');
    this.lastTalk[npcId] = this.tick * (TICK_MS / 1000);
    const s = SCRIPTS[npcId];
    let line: string | undefined;
    if (/where|alibi|when|ten|10|night|doing|were you/i.test(text)) line = s.alibi;
    if (!line) for (const [re, l] of s.topics) if (new RegExp(re, 'i').test(text)) { line = l; break; }
    if (!line) {
      const i = (this.genericIdx[npcId] = (this.genericIdx[npcId] ?? -1) + 1);
      line = s.generic[i % s.generic.length];
    }
    this.reply({ type: 'npc_say', payload: { npcId, text: line } }, rand(700, 1800));
  }

  private onInspect(clueId: string): void {
    if (!this.active) return this.error('NO_ACTIVE_CASE');
    const c = this.clues.find((x) => x.id === clueId);
    if (!c) return this.error('UNKNOWN_CLUE');
    this.reply({ type: 'clue_info', payload: { clueId: c.id, title: c.title, text: c.text, room: c.room } }, 250);
  }

  private onHint(): void {
    if (!this.active) return this.error('NO_ACTIVE_CASE');
    const now = Date.now();
    if (now - this.lastHintAt < 600) return this.error('RATE_LIMITED', 'Slow down.');
    this.lastHintAt = now;
    const cfg = CONFIG[this.difficulty];
    if (this.hintsUsed >= cfg.maxHints) return this.error('HINT_CAP_REACHED');
    const row = this.row();
    if (row.diamonds < HINT_COST) return this.error('INSUFFICIENT_DIAMONDS'); // balance never goes below 0
    row.diamonds -= HINT_COST;
    this.save(row);
    this.hintsUsed++;
    const tier = Math.min(this.hintsUsed, 3);
    const damning = SCRIPTS[this.killer].damning;
    const text = [
      'Listen again to what each of them said about where they were at ten. One account will not survive a second look.',
      `Search the ${roomName(damning.room)}. Something there does not belong to the story you were told.`,
      `Compare "${damning.title}" with what the household told you about the evening. One alibi does not hold.`,
    ][tier - 1];
    this.reply({
      type: 'hint',
      payload: { tier, text, cost: HINT_COST, diamonds: row.diamonds, hintsLeft: cfg.maxHints - this.hintsUsed },
    }, 450);
    this.reply({ type: 'diamonds_update', payload: { balance: row.diamonds, reason: 'hint' } }, 460);
  }

  private onAccuse(npcId: string): void {
    if (!this.active) return this.error('NO_ACTIVE_CASE');
    if (this.accusedAlready) return this.error('ALREADY_ACCUSED');
    if (!SUSPECT_IDS.includes(npcId as NpcId)) return this.error('BAD_REQUEST', 'You must accuse one of the suspects.');
    this.accusedAlready = true;
    this.active = false;
    window.clearInterval(this.timer);
    const won = npcId === this.killer;
    const row = this.row();
    const reward = won ? CONFIG[this.difficulty].reward : 0;
    if (won) { row.diamonds += reward; row.casesSolved += 1; this.save(row); }
    const timeline = [...TRUE_TIMELINE_HEAD, SCRIPTS[this.killer].timelineLine, ...TRUE_TIMELINE_TAIL];
    const secrets: Record<string, string> = {};
    for (const id of SUSPECT_IDS) secrets[id] = SCRIPTS[id].secret;
    if (won) this.reply({ type: 'diamonds_update', payload: { balance: row.diamonds, reason: 'reward' } }, 700);
    this.reply({
      type: 'game_over',
      payload: { won, killerId: this.killer, timeline, secrets, reward, diamonds: row.diamonds },
    }, 800);
  }

  /** DEV ONLY: set the pretend balance (to test the empty-diamonds state). */
  devSetDiamonds(n: number): void {
    if (!this.playerId) return;
    const row = this.row();
    row.diamonds = Math.max(0, n);
    this.save(row);
  }

  /** DEV ONLY: accuse correctly or incorrectly without playing. */
  devAccuse(won: boolean): void {
    if (!this.active) return;
    const wrong = SUSPECT_IDS.find((id) => id !== this.killer)!;
    this.onAccuse(won ? this.killer : wrong);
  }
}

export function getMock(): MockTransport | null { return current; }
