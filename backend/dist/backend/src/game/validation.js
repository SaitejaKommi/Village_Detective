"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAction = validateAction;
function validateAction(world, npcId, action) {
    const npc = world.npc(npcId);
    if (!npc)
        return { ok: false, reason: 'unknown npc' };
    switch (action.action) {
        case 'idle':
            return { ok: true, action };
        case 'say':
            if (!action.say)
                return { ok: false, reason: 'say requires text' };
            return { ok: true, action };
        case 'move': {
            if (!action.target)
                return { ok: false, reason: 'move requires a room' };
            const roomId = resolveRoomId(world, action.target);
            if (!roomId)
                return { ok: false, reason: 'unknown room' };
            const adjacent = world.adjacentRooms(npc.roomId).some((room) => room.id === roomId);
            if (!adjacent)
                return { ok: false, reason: 'room is not adjacent' };
            return { ok: true, action: { ...action, target: roomId } };
        }
        case 'gossip': {
            if (!action.target)
                return { ok: false, reason: 'gossip requires a listener' };
            const targetId = resolveNpcId(world, action.target);
            if (!targetId)
                return { ok: false, reason: 'unknown listener' };
            if (targetId === npcId)
                return { ok: false, reason: 'cannot gossip to yourself' };
            const target = world.npc(targetId);
            if (!target || target.roomId !== npc.roomId) {
                return { ok: false, reason: 'listener is not in this room' };
            }
            return { ok: true, action: { ...action, target: targetId } };
        }
        case 'inspect': {
            if (!action.target)
                return { ok: false, reason: 'inspect requires a clue' };
            const clueId = resolveClueId(world, action.target);
            if (!clueId)
                return { ok: false, reason: 'unknown clue' };
            const clue = world.clues.get(clueId);
            if (!clue || clue.roomId !== npc.roomId) {
                return { ok: false, reason: 'clue is not in this room' };
            }
            return { ok: true, action: { ...action, target: clueId } };
        }
        default:
            return { ok: false, reason: 'unsupported action' };
    }
}
function resolveRoomId(world, raw) {
    if (world.rooms.has(raw))
        return raw;
    const key = normalise(raw);
    if (world.rooms.has(key))
        return key;
    for (const room of world.rooms.values()) {
        if (normalise(room.name) === key)
            return room.id;
    }
    return null;
}
function resolveNpcId(world, raw) {
    if (world.npcs.has(raw))
        return raw;
    const key = normalise(raw);
    for (const npc of world.npcs.values()) {
        if (normalise(npc.name) === key)
            return npc.id;
    }
    return null;
}
function resolveClueId(world, raw) {
    if (world.clues.has(raw))
        return raw;
    const key = normalise(raw);
    for (const clue of world.clues.values()) {
        if (normalise(clue.text) === key)
            return clue.id;
    }
    return null;
}
function normalise(value) {
    return value.trim().toLowerCase().replace(/\s+/g, '_');
}
//# sourceMappingURL=validation.js.map