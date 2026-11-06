"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeSurroundings = describeSurroundings;
exports.emitPerception = emitPerception;
exports.applyNpcAction = applyNpcAction;
exports.runAmbient = runAmbient;
const broadcast_1 = require("../net/broadcast");
const validation_1 = require("./validation");
const AMBIENT_MOVE_EVERY = 10;
const AMBIENT_GOSSIP_EVERY = 20;
function describeSurroundings(session, npcId) {
    const npc = session.world.npc(npcId);
    if (!npc)
        return '';
    const room = session.world.rooms.get(npc.roomId);
    const present = session.world
        .npcsInRoom(npc.roomId)
        .filter((other) => other.id !== npcId)
        .map((other) => other.name);
    const exits = session.world
        .adjacentRooms(npc.roomId)
        .map((candidate) => `${candidate.id} (${candidate.name})`);
    const detective = session.world.player?.roomId === npc.roomId ? 'The detective is here.' : '';
    return [
        `You are in ${room ? `${room.id} (${room.name})` : npc.roomId}.`,
        present.length > 0 ? `Present: ${present.join(', ')}.` : 'You are alone.',
        detective,
        exits.length > 0 ? `Exits: ${exits.join(', ')}.` : '',
    ]
        .filter(Boolean)
        .join(' ');
}
function emitPerception(session, roomId, text, importance = 2, exceptNpcIds = []) {
    for (const npc of session.world.npcsInRoom(roomId)) {
        if (exceptNpcIds.includes(npc.id))
            continue;
        session.agents.get(npc.id)?.memory.add(text, session.world.clock, importance);
    }
}
function applyNpcAction(ctx, session, npcId, output, perception, options = {}) {
    const agent = session.agents.get(npcId);
    const npc = session.world.npc(npcId);
    if (!agent || !npc)
        return { applied: false, reason: 'unknown npc' };
    const validation = (0, validation_1.validateAction)(session.world, npcId, output);
    if (!validation.ok) {
        sendDebug(ctx, session, npcId, perception, output, validation.reason);
        return { applied: false, reason: validation.reason };
    }
    const action = validation.action;
    switch (action.action) {
        case 'idle':
            break;
        case 'say': {
            const text = action.say ?? '';
            agent.memory.add(`You said: ${text}`, session.world.clock, 1);
            emitPerception(session, npc.roomId, `${npc.name} says: "${text}"`, 2, [npcId]);
            if (options.announceToPlayer && session.world.player?.roomId === npc.roomId) {
                (0, broadcast_1.sendToSession)(ctx, session.id, { type: 'npc_say', npcId, text });
            }
            sendDebug(ctx, session, npcId, perception, action);
            return { applied: true, say: text };
        }
        case 'move': {
            const targetId = action.target;
            const from = npc.roomId;
            session.world.moveNpc(npcId, targetId);
            emitPerception(session, from, `${npc.name} leaves the room.`, 1, [npcId]);
            emitPerception(session, targetId, `${npc.name} enters the room.`, 1, [npcId]);
            break;
        }
        case 'gossip': {
            const target = session.world.npc(action.target);
            if (!target) {
                sendDebug(ctx, session, npcId, perception, action, 'unknown listener');
                return { applied: false, reason: 'unknown listener' };
            }
            const text = action.say ?? `${npc.name} murmurs to ${target.name}.`;
            agent.memory.add(`You told ${target.name}: ${text}`, session.world.clock, 2);
            session.agents
                .get(target.id)
                ?.memory.add(`${npc.name} told you: ${text}`, session.world.clock, 2);
            emitPerception(session, npc.roomId, `${npc.name} whispers to ${target.name}: "${text}"`, 2, [npcId, target.id]);
            if (options.announceToPlayer && session.world.player?.roomId === npc.roomId) {
                (0, broadcast_1.sendToSession)(ctx, session.id, {
                    type: 'event',
                    kind: 'info',
                    text: `${npc.name} and ${target.name} speak in low voices.`,
                });
            }
            break;
        }
        case 'inspect': {
            const clue = session.world.clues.get(action.target);
            if (clue)
                agent.memory.add(`You examined: ${clue.text}`, session.world.clock, 3);
            break;
        }
    }
    sendDebug(ctx, session, npcId, perception, action);
    return { applied: true };
}
function runAmbient(ctx, session) {
    if (session.solved || !session.caseFile)
        return;
    const world = session.world;
    if (world.tick % AMBIENT_MOVE_EVERY === 0) {
        const npcs = [...world.npcs.values()];
        const step = world.tick / AMBIENT_MOVE_EVERY;
        const npc = npcs[step % npcs.length];
        if (npc) {
            const exits = world.adjacentRooms(npc.roomId);
            const room = exits[step % exits.length];
            if (room) {
                const perception = `${describeSurroundings(session, npc.id)} You decide to slip into another room.`;
                applyNpcAction(ctx, session, npc.id, { action: 'move', target: room.id, thought: 'I want to avoid the detective.' }, perception);
            }
        }
    }
    if (world.tick % AMBIENT_GOSSIP_EVERY !== 0 || session.ambientBusy)
        return;
    const room = [...world.rooms.values()].find((candidate) => world.npcsInRoom(candidate.id).length >= 2);
    if (!room)
        return;
    const [first, second] = world.npcsInRoom(room.id);
    if (!first || !second)
        return;
    const agent = session.agents.get(first.id);
    if (!agent)
        return;
    session.ambientBusy = true;
    const perception = `${describeSurroundings(session, first.id)} ${second.name} is close enough to talk. Share a rumour, probe for information, or keep your secret.`;
    void ctx.queue
        .enqueue(() => agent.decide(perception, ctx.llm), 0)
        .then((output) => {
        applyNpcAction(ctx, session, first.id, output, perception, { announceToPlayer: true });
    })
        .catch(() => {
        /* provider failures are already handled by the fallback chain */
    })
        .finally(() => {
        session.ambientBusy = false;
    });
}
function sendDebug(ctx, session, npcId, perception, output, rejection) {
    if (!ctx.debugAgents)
        return;
    const memory = session.agents.get(npcId)?.memory.all().slice(-5).map((entry) => entry.text) ?? [];
    const thought = rejection ? `Rejected action: ${rejection}` : output.thought ?? '';
    (0, broadcast_1.sendToSession)(ctx, session.id, { type: 'debug', npcId, perception, memory, thought });
}
//# sourceMappingURL=engine.js.map