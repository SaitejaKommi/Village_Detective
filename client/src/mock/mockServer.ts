// MOCK SERVER. Speaks the backend's FLAT protocol (shared/types.ts) in-browser, behind the same Transport
// interface as the real WebSocket client. Loaded lazily, only when VITE_USE_MOCK is not "false".
//
// It mirrors the real server's rules: one case per session, `inspect` answered by an `event` plus a fresh
// `state`, no profile push on join, integer-only `move`, string error codes, `game_over` followed by a reward
// `diamonds_update`. It plays the part of the server, so it may "know" the solution: it picks the killer at
// random in start_case and keeps it private until game_over. Content here is the mock's own (not the real
// case file). The pretend balance lives in localStorage inside this module only. UI code never touches it.
import type {
  CaseStartedMessage, ClientMessage, ConnectionStatus, Difficulty, ErrorCode, HintMessage, RoomState,
  ServerMessage, StateMessage, TimelineEvent,
} from '../net/protocol';
import type { Transport } from '../net/transport';
import { NPCS, SUSPECT_IDS, VICTIM_ID, type NpcId } from '../data/npcs';
import { roomName, ROOMS, neighbours } from '../data/mansion';
import { NEUTRAL_CLUES, SCRIPTS, TRUE_TIMELINE_HEAD, TRUE_TIMELINE_TAIL } from './script';

const TICK_MS = 1000; // like the real server
const STORE_KEY = 'vol.mock.server';
const START_DIAMONDS = 3;
const HINT_COST = 1;
const CONFIG: Record<Difficulty, { maxHints: number; reward: number }> = {
  easy: { maxHints: 4, reward: 1 },
  medium: { maxHints: 3, reward: 2 },
  hard: { maxHints: 1, reward: 3 },
};
const TIERS: HintMessage['tier'][] = ['direction', 'location', 'contradiction', 'contradiction'];

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

interface MockNpc { id: NpcId; roomId: string; nextMoveAt: number }
interface MockClue { id: string; roomId: string; text: string; discovered: boolean }

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let current: MockTransport | null = null;

export class MockTransport implements Transport {
  private msgCb: (m: ServerMessage) => void = () => {};
  private statusCb: (s: ConnectionStatus) => void = () => {};
  private playerId = '';
  private sessionId = '';
  private online = false;

  // per-session case state (the "truth")
  private started = false;
  private solved = false;
  private difficulty: Difficulty = 'easy';
  private killer: NpcId = 'evelyn';
  private hintsUsed = 0;
  private lastHintAt = 0;
  private lastTalkAt = 0;
  private npcs: MockNpc[] = [];
  private clues: MockClue[] = [];
  private lastTalk: Record<string, number> = {};
  private genericIdx: Record<string, number> = {};
  private tick = 0;
  private clock = 0;
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
  private fail(code: ErrorCode, message: string): void {
    this.reply({ type: 'error', code, message });
  }

  // ---- inbound ------------------------------------------------------------
  send(msg: ClientMessage): void {
    if (!this.online) return;
    switch (msg.type) {
      case 'join': return this.onJoin(msg.playerId, msg.sessionId);
      case 'get_profile': return this.sendProfile();
      case 'start_case': return this.onStartCase(msg.difficulty);
      case 'move': return this.onMove(msg.dx, msg.dy);
      case 'talk': return this.onTalk(msg.npcId, msg.text);
      case 'inspect': return this.onInspect(msg.clueId);
      case 'hint_request': return this.onHint();
      case 'accuse': return this.onAccuse(msg.npcId);
      default: return this.fail('INVALID_MESSAGE', 'Unsupported or malformed message');
    }
  }

  private row(): PlayerRow { return readDb()[this.playerId]; }
  private save(row: PlayerRow): void {
    const db = readDb();
    db[this.playerId] = row;
    writeDb(db);
  }

  private onJoin(playerId?: string, sessionId?: string): void {
    const db = readDb();
    if (playerId && db[playerId]) this.playerId = playerId;
    else {
      this.playerId = uuid();
      db[this.playerId] = { diamonds: START_DIAMONDS, casesSolved: 0, outfitId: 'default' };
      writeDb(db);
    }
    if (sessionId && sessionId === this.sessionId) {
      // resume the running session
      this.reply({ type: 'session', sessionId: this.sessionId, playerId: this.playerId });
      if (this.started) this.sendState();
      return;
    }
    // a join without a (matching) sessionId always opens a fresh session
    window.clearInterval(this.timer);
    this.sessionId = uuid();
    this.started = false;
    this.solved = false;
    this.reply({ type: 'session', sessionId: this.sessionId, playerId: this.playerId });
    // note: the real server does not push `profile` here. The client asks with get_profile.
  }

  private sendProfile(): void {
    if (!this.playerId) return this.fail('INVALID_MESSAGE', 'Send join first');
    const r = this.row();
    this.reply({ type: 'profile', playerId: this.playerId, diamonds: r.diamonds, casesSolved: r.casesSolved, outfitId: r.outfitId });
  }

  private onStartCase(difficulty: Difficulty): void {
    if (!this.playerId || !this.sessionId) return this.fail('INVALID_MESSAGE', 'Send join first');
    if (this.started) return this.fail('CASE_ALREADY_STARTED', 'A case is already running in this session');
    if (!(difficulty in CONFIG)) return this.fail('INVALID_MESSAGE', 'Unknown difficulty');
    this.difficulty = difficulty;
    this.killer = pick(SUSPECT_IDS);
    this.hintsUsed = 0;
    this.started = true;
    this.solved = false;
    this.tick = 0;
    this.clock = 0;
    this.lastTalk = {};
    this.buildClues();
    this.npcs = SUSPECT_IDS.map((id) => ({ id, roomId: NPCS[id].home, nextMoveAt: rand(4, 10) }));

    const rooms: RoomState[] = ROOMS.map((r) => ({ id: r.id, name: r.name, adjacent: neighbours(r.id) }));
    const msg: CaseStartedMessage = {
      type: 'case_started',
      caseId: 'mock-blackwood-manor',
      difficulty,
      briefing: {
        title: 'The Blackwood Manor Murder',
        victimId: VICTIM_ID,
        victimName: NPCS[VICTIM_ID].name,
        scene:
          'Blackwood Manor, a stormy night. Alistair Blackwood was found dead in his study shortly before eleven. ' +
          'The doors were bolted against the rain. Whoever did it is still under this roof.',
        summary:
          'Five people were in the house. Each of them has something to hide, and not every secret is about the murder. ' +
          'Question them, search the rooms, and name the killer.',
      },
      rooms,
      suspects: SUSPECT_IDS.map((id) => ({ id, name: NPCS[id].name, role: NPCS[id].role, portraitId: id })),
    };
    this.reply(msg, 350);
    this.reply(this.stateMsg(), 380);
    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.onTick(), TICK_MS);
  }

  private buildClues(): void {
    const list: MockClue[] = [];
    for (const n of NEUTRAL_CLUES) list.push({ id: n.id, roomId: n.room, text: n.text, discovered: false });
    for (const id of SUSPECT_IDS) {
      const s = SCRIPTS[id];
      const c = id === this.killer ? s.damning : s.herring;
      list.push({ id: c.id, roomId: c.room, text: c.text, discovered: false });
    }
    this.clues = list;
  }

  private stateMsg(): StateMessage {
    return {
      type: 'state',
      tick: this.tick,
      clock: this.clock,
      player: { id: this.playerId, roomId: 'foyer', position: { x: 0, y: 0 } },
      // Like the real server: NPCs carry a roomId and meaningless small-integer positions.
      npcs: this.npcs.map((n, i) => ({ id: n.id, name: NPCS[n.id].name, roomId: n.roomId, position: { x: 1 + (i % 4), y: 1 + (i % 3) } })),
      clues: this.clues.map((c) => ({ id: c.id, roomId: c.roomId, discovered: c.discovered, text: c.discovered ? c.text : undefined })),
    };
  }
  private sendState(): void { this.reply(this.stateMsg()); }

  private onTick(): void {
    if (this.solved) return;
    this.tick++;
    this.clock++;
    const now = this.tick;
    for (const n of this.npcs) {
      const talking = now - (this.lastTalk[n.id] ?? -99) < 18;
      if (talking || now < n.nextMoveAt) continue;
      n.roomId = pick(neighbours(n.roomId)); // NPCs hop to an adjacent room, like the real server
      n.nextMoveAt = now + rand(8, 18);
    }
    if (this.online) this.msgCb(this.stateMsg());
  }

  private onMove(dx: number, dy: number): void {
    // The real server's schema only accepts integers in -1..1.
    const okv = (v: unknown) => Number.isInteger(v) && (v as number) >= -1 && (v as number) <= 1;
    if (!okv(dx) || !okv(dy)) return this.fail('INVALID_MESSAGE', 'Unsupported or malformed message');
    if (!this.started) return this.fail('NO_ACTIVE_CASE', 'Start a case first');
  }

  private onTalk(npcId: string, textRaw: string): void {
    if (!this.started) return this.fail('NO_ACTIVE_CASE', 'Start a case first');
    const text = String(textRaw ?? '').trim();
    if (text.length < 1 || text.length > 300) return this.fail('INVALID_MESSAGE', 'Say something, in 300 characters or fewer.');
    const now = Date.now();
    if (now - this.lastTalkAt < 1000) return this.fail('RATE_LIMITED', 'Wait a moment before speaking again');
    this.lastTalkAt = now;
    if (!SUSPECT_IDS.includes(npcId as NpcId)) return this.fail('NPC_NOT_FOUND', 'That suspect is not available');
    this.lastTalk[npcId] = this.tick;
    const s = SCRIPTS[npcId];
    let line: string | undefined;
    if (/where|alibi|when|ten|10|night|doing|were you/i.test(text)) line = s.alibi;
    if (!line) for (const [re, l] of s.topics) if (new RegExp(re, 'i').test(text)) { line = l; break; }
    if (!line) {
      const i = (this.genericIdx[npcId] = (this.genericIdx[npcId] ?? -1) + 1);
      line = s.generic[i % s.generic.length];
    }
    this.reply({ type: 'npc_say', npcId, text: line }, rand(700, 1800));
  }

  private onInspect(clueId: string): void {
    if (!this.started) return this.fail('NO_ACTIVE_CASE', 'Start a case first');
    const c = this.clues.find((x) => x.id === clueId);
    if (!c) return this.fail('CLUE_NOT_FOUND', 'No such clue');
    c.discovered = true;
    // The real server replies with an event carrying the text, then a fresh state with `discovered: true`.
    this.reply({ type: 'event', kind: 'clue', text: c.text }, 200);
    this.reply(this.stateMsg(), 210);
  }

  private onHint(): void {
    if (!this.started) return this.fail('NO_ACTIVE_CASE', 'Start a case first');
    const now = Date.now();
    if (now - this.lastHintAt < 1000) return this.fail('RATE_LIMITED', 'Wait a moment before asking for another hint');
    this.lastHintAt = now;
    const cfg = CONFIG[this.difficulty];
    if (this.hintsUsed >= cfg.maxHints) return this.fail('HINT_CAP_REACHED', 'No hints remaining for this case');
    const row = this.row();
    if (row.diamonds < HINT_COST) return this.fail('INSUFFICIENT_DIAMONDS', 'Not enough diamonds'); // never below 0
    row.diamonds -= HINT_COST;
    this.save(row);
    this.hintsUsed++;
    const damning = SCRIPTS[this.killer].damning;
    const texts = [
      'Listen again to what each of them said about where they were at ten. One account will not survive a second look.',
      `Search the ${roomName(damning.room)}. Something there does not belong to the story you were told.`,
      'Compare the evidence you found with what the household told you. One alibi does not hold.',
      'Ask each suspect where they were at twenty past ten, then compare the answers with your clues.',
    ];
    this.reply({
      type: 'hint', tier: TIERS[this.hintsUsed - 1], text: texts[this.hintsUsed - 1], cost: HINT_COST,
      diamonds: row.diamonds, hintsLeft: cfg.maxHints - this.hintsUsed,
    }, 450);
    this.reply({ type: 'diamonds_update', balance: row.diamonds, reason: 'hint' }, 460);
  }

  private onAccuse(npcId: string): void {
    if (!this.started) return this.fail('NO_ACTIVE_CASE', 'Start a case first');
    if (this.solved) return this.fail('CASE_ALREADY_SOLVED', 'This case is already closed');
    if (!SUSPECT_IDS.includes(npcId as NpcId)) return this.fail('NPC_NOT_FOUND', 'That suspect is not available');
    this.solved = true;
    window.clearInterval(this.timer);
    const won = npcId === this.killer;
    const row = this.row();
    const reward = won ? CONFIG[this.difficulty].reward : 0;
    if (won) { row.diamonds += reward; row.casesSolved += 1; this.save(row); }
    const killerEvent = { time: 23, place: roomName(SCRIPTS[this.killer].damning.room), actorId: this.killer, text: SCRIPTS[this.killer].timelineLine };
    const timeline: TimelineEvent[] = [...TRUE_TIMELINE_HEAD, killerEvent, ...TRUE_TIMELINE_TAIL];
    const secrets: Record<string, string> = {};
    for (const id of SUSPECT_IDS) secrets[id] = SCRIPTS[id].secret;
    // Like the real server: game_over has no reward field. The new balance follows in diamonds_update.
    this.reply({ type: 'game_over', won, killerId: this.killer, timeline, secrets }, 800);
    if (won) this.reply({ type: 'diamonds_update', balance: row.diamonds, reason: 'reward' }, 850);
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
    if (!this.started || this.solved) return;
    const wrong = SUSPECT_IDS.find((id) => id !== this.killer)!;
    this.onAccuse(won ? this.killer : wrong);
  }
}

export function getMock(): MockTransport | null { return current; }
