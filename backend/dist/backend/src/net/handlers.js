"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
const node_crypto_1 = require("node:crypto");
const caseRuns_1 = require("../db/caseRuns");
const hints_1 = require("../db/hints");
const players_1 = require("../db/players");
const transcripts_1 = require("../db/transcripts");
const accusation_1 = require("../game/accusation");
const caseLoader_1 = require("../game/caseLoader");
const engine_1 = require("../game/engine");
const hints_2 = require("../game/hints");
const session_1 = require("../game/session");
const broadcast_1 = require("./broadcast");
const schemas_1 = require("./schemas");
function fail(conn, code, message) {
    (0, broadcast_1.send)(conn, { type: 'error', code, message });
}
async function handleMessage(ctx, conn, raw) {
    let parsed;
    try {
        parsed = schemas_1.ClientMessageSchema.safeParse(JSON.parse(raw));
    }
    catch {
        fail(conn, 'INVALID_MESSAGE', 'Message is not valid JSON');
        return;
    }
    if (!parsed.success) {
        fail(conn, 'INVALID_MESSAGE', 'Unsupported or malformed message');
        return;
    }
    try {
        switch (parsed.data.type) {
            case 'join':
                join(ctx, conn, parsed.data);
                return;
            case 'get_profile':
                getProfile(ctx, conn);
                return;
            case 'start_case':
                startCase(ctx, conn, parsed.data);
                return;
            case 'move':
                move(ctx, conn, parsed.data);
                return;
            case 'talk':
                await talk(ctx, conn, parsed.data);
                return;
            case 'inspect':
                inspect(ctx, conn, parsed.data);
                return;
            case 'hint_request':
                hintRequest(ctx, conn, parsed.data);
                return;
            case 'accuse':
                accuse(ctx, conn, parsed.data);
                return;
        }
    }
    catch (error) {
        fail(conn, 'INVALID_MESSAGE', error instanceof Error ? error.message : 'Unexpected error');
    }
}
function requirePlayer(ctx, conn) {
    if (!conn.playerId) {
        fail(conn, 'INVALID_MESSAGE', 'Send join first');
        return null;
    }
    const player = (0, players_1.getPlayer)(ctx.db, conn.playerId);
    if (!player) {
        fail(conn, 'INVALID_MESSAGE', 'Unknown player');
        return null;
    }
    return player;
}
function requireSession(ctx, conn) {
    if (!conn.sessionId) {
        fail(conn, 'NO_ACTIVE_CASE', 'Send join first');
        return null;
    }
    const session = ctx.sessions.get(conn.sessionId);
    if (!session) {
        fail(conn, 'NO_ACTIVE_CASE', 'Send join first');
        return null;
    }
    return session;
}
function requireCase(ctx, conn) {
    const session = requireSession(ctx, conn);
    if (!session)
        return null;
    if (!session.caseFile || !session.caseRunId || !session.difficulty) {
        fail(conn, 'NO_ACTIVE_CASE', 'Start a case first');
        return null;
    }
    return session;
}
function join(ctx, conn, message) {
    const player = (0, players_1.ensurePlayer)(ctx.db, message.playerId);
    let session = message.sessionId ? ctx.sessions.get(message.sessionId) : undefined;
    if (session && session.playerId !== player.id)
        session = undefined;
    if (!session) {
        const sessionId = message.sessionId ?? (0, node_crypto_1.randomUUID)();
        session = new session_1.GameSession(sessionId, player.id);
        ctx.sessions.set(sessionId, session);
    }
    conn.playerId = player.id;
    conn.sessionId = session.id;
    conn.caseRunId = session.caseRunId ?? undefined;
    (0, broadcast_1.send)(conn, { type: 'session', sessionId: session.id, playerId: player.id });
    if (session.caseFile)
        (0, broadcast_1.send)(conn, { type: 'state', ...session.world.toState() });
}
function getProfile(ctx, conn) {
    const player = requirePlayer(ctx, conn);
    if (!player)
        return;
    (0, broadcast_1.send)(conn, {
        type: 'profile',
        playerId: player.id,
        diamonds: player.diamonds,
        casesSolved: player.cases_solved,
        outfitId: player.outfit_id,
    });
}
function startCase(ctx, conn, message) {
    const player = requirePlayer(ctx, conn);
    if (!player)
        return;
    const session = requireSession(ctx, conn);
    if (!session)
        return;
    if (session.caseFile) {
        fail(conn, 'CASE_ALREADY_STARTED', 'A case is already running in this session');
        return;
    }
    const difficulty = ctx.difficulties.get(message.difficulty);
    if (!difficulty) {
        fail(conn, 'INVALID_MESSAGE', 'Unknown difficulty');
        return;
    }
    const caseFile = (0, caseLoader_1.loadCaseFile)(ctx.dataDir);
    const built = (0, caseLoader_1.buildCase)(session.world, caseFile, difficulty, ctx.personas, ctx.rooms, player.id);
    const caseRunId = (0, node_crypto_1.randomUUID)();
    (0, caseRuns_1.createCaseRun)(ctx.db, caseRunId, player.id, caseFile.caseId, difficulty.id);
    session.caseFile = caseFile;
    session.difficulty = difficulty;
    session.caseRunId = caseRunId;
    session.agents = built.agents;
    session.hintService = new hints_2.HintService(caseFile, difficulty.maxHints);
    conn.caseRunId = caseRunId;
    const started = {
        type: 'case_started',
        caseId: caseFile.caseId,
        difficulty: difficulty.id,
        briefing: built.briefing,
        rooms: built.rooms,
        suspects: built.suspects,
    };
    (0, broadcast_1.send)(conn, started);
    (0, broadcast_1.sendState)(ctx, session);
}
function move(ctx, conn, message) {
    const session = requireCase(ctx, conn);
    if (!session)
        return;
    const player = session.world.player;
    if (!player)
        return;
    player.position = {
        x: Math.max(0, player.position.x + message.dx),
        y: Math.max(0, player.position.y + message.dy),
    };
    (0, broadcast_1.sendState)(ctx, session);
}
async function talk(ctx, conn, message) {
    const session = requireCase(ctx, conn);
    if (!session || !session.caseRunId)
        return;
    const now = Date.now();
    if (now - conn.lastTalkAt < 1000) {
        fail(conn, 'RATE_LIMITED', 'Wait a moment before speaking again');
        return;
    }
    conn.lastTalkAt = now;
    const agent = session.agents.get(message.npcId);
    const npc = session.world.npc(message.npcId);
    if (!agent || !npc) {
        fail(conn, 'NPC_NOT_FOUND', 'That suspect is not available');
        return;
    }
    const perception = `${(0, engine_1.describeSurroundings)(session, npc.id)} The detective says: "${message.text}"`;
    (0, transcripts_1.insertTranscript)(ctx.db, session.caseRunId, message.npcId, 'player', message.text);
    agent.memory.add(`Detective asked: ${message.text}`, session.world.clock, 2);
    (0, engine_1.emitPerception)(session, npc.roomId, `The detective says to ${npc.name}: "${message.text}"`, 1, [npc.id]);
    let output = { action: 'idle' };
    try {
        output = await ctx.queue.enqueue(() => agent.decide(perception, ctx.llm), 10);
    }
    catch {
        /* the fallback chain already protects this; keep the conversation alive */
    }
    const applied = (0, engine_1.applyNpcAction)(ctx, session, npc.id, output, perception);
    const reply = output.say ?? (output.action === 'idle' ? 'I have nothing to say.' : '...');
    if (!applied.say) {
        agent.memory.add(`You told the detective: ${reply}`, session.world.clock, 2);
    }
    (0, transcripts_1.insertTranscript)(ctx.db, session.caseRunId, message.npcId, 'npc', reply);
    (0, broadcast_1.send)(conn, { type: 'npc_say', npcId: message.npcId, text: reply });
}
function inspect(ctx, conn, message) {
    const session = requireCase(ctx, conn);
    if (!session)
        return;
    const clue = session.world.clues.get(message.clueId);
    if (!clue) {
        fail(conn, 'CLUE_NOT_FOUND', 'No such clue');
        return;
    }
    if (session.world.player && clue.roomId !== session.world.player.roomId) {
        fail(conn, 'CLUE_NOT_FOUND', 'That clue is not in this room');
        return;
    }
    clue.discovered = true;
    (0, engine_1.emitPerception)(session, clue.roomId, `The detective examined ${clue.text}`, 2);
    (0, broadcast_1.send)(conn, { type: 'event', kind: 'clue', text: clue.text });
    (0, broadcast_1.sendState)(ctx, session);
}
function hintRequest(ctx, conn, _message) {
    const player = requirePlayer(ctx, conn);
    if (!player)
        return;
    const session = requireCase(ctx, conn);
    if (!session || !session.hintService || !session.caseRunId)
        return;
    const now = Date.now();
    if (now - conn.lastHintAt < 1000) {
        fail(conn, 'RATE_LIMITED', 'Wait a moment before asking for another hint');
        return;
    }
    conn.lastHintAt = now;
    if (!session.hintService.hasNext()) {
        fail(conn, 'HINT_CAP_REACHED', 'No hints remaining for this case');
        return;
    }
    if (!(0, players_1.deductDiamond)(ctx.db, player.id)) {
        fail(conn, 'INSUFFICIENT_DIAMONDS', 'Not enough diamonds');
        return;
    }
    const hint = session.hintService.next();
    if (!hint) {
        fail(conn, 'HINT_CAP_REACHED', 'No hints remaining for this case');
        return;
    }
    (0, hints_1.logHint)(ctx.db, session.caseRunId, hint.tier, 1);
    (0, caseRuns_1.incrementHints)(ctx.db, session.caseRunId);
    const updated = (0, players_1.getPlayer)(ctx.db, player.id);
    const balance = updated?.diamonds ?? 0;
    (0, broadcast_1.send)(conn, {
        type: 'hint',
        tier: hint.tier,
        text: hint.text,
        cost: 1,
        diamonds: balance,
        hintsLeft: session.hintService.remaining(),
    });
    (0, broadcast_1.send)(conn, { type: 'diamonds_update', balance, reason: 'hint' });
}
function accuse(ctx, conn, message) {
    const session = requireCase(ctx, conn);
    if (!session || !session.caseFile || !session.caseRunId || !session.difficulty)
        return;
    if (session.solved) {
        fail(conn, 'CASE_ALREADY_SOLVED', 'This case is already closed');
        return;
    }
    session.solved = true;
    const outcome = (0, accusation_1.resolveAccusation)(message.npcId, session.caseFile);
    let reward = 0;
    if (outcome.won) {
        const granted = (0, caseRuns_1.grantReward)(ctx.db, session.caseRunId, session.playerId, session.difficulty.rewardDiamonds);
        if (granted)
            reward = session.difficulty.rewardDiamonds;
    }
    else {
        (0, caseRuns_1.markLost)(ctx.db, session.caseRunId);
    }
    const secrets = {};
    for (const persona of ctx.personas.values())
        secrets[persona.id] = persona.secret;
    (0, broadcast_1.sendToSession)(ctx, session.id, {
        type: 'game_over',
        won: outcome.won,
        killerId: outcome.killerId,
        timeline: session.caseFile.timeline,
        secrets,
    });
    if (reward > 0) {
        const updated = (0, players_1.getPlayer)(ctx.db, session.playerId);
        (0, broadcast_1.sendToSession)(ctx, session.id, {
            type: 'diamonds_update',
            balance: updated?.diamonds ?? 0,
            reason: 'reward',
        });
    }
}
//# sourceMappingURL=handlers.js.map