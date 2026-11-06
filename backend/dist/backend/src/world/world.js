"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.World = void 0;
const truthLog_1 = require("./truthLog");
class World {
    tick = 0;
    clock = 0;
    activeCaseId = null;
    player = null;
    rooms = new Map();
    npcs = new Map();
    clues = new Map();
    truth = new truthLog_1.TruthLog();
    reset() {
        this.tick = 0;
        this.clock = 0;
        this.activeCaseId = null;
        this.player = null;
        this.rooms.clear();
        this.npcs.clear();
        this.clues.clear();
    }
    loadRooms(rooms) {
        for (const room of rooms)
            this.rooms.set(room.id, room);
    }
    roomOf(entityId) {
        if (this.player?.id === entityId)
            return this.player.roomId;
        return this.npcs.get(entityId)?.roomId ?? null;
    }
    npc(id) {
        return this.npcs.get(id);
    }
    npcsInRoom(roomId) {
        return [...this.npcs.values()].filter((npc) => npc.roomId === roomId);
    }
    adjacentRooms(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return [];
        return room.adjacent.flatMap((id) => {
            const adjacent = this.rooms.get(id);
            return adjacent ? [adjacent] : [];
        });
    }
    moveNpc(npcId, roomId) {
        const npc = this.npcs.get(npcId);
        if (!npc || !this.rooms.has(roomId))
            return false;
        npc.roomId = roomId;
        return true;
    }
    toState() {
        return {
            tick: this.tick,
            clock: this.clock,
            player: this.player ?? { id: '', roomId: '', position: { x: 0, y: 0 } },
            npcs: [...this.npcs.values()].map((npc) => ({
                id: npc.id,
                name: npc.name,
                roomId: npc.roomId,
                position: npc.position,
                mood: npc.mood,
            })),
            clues: [...this.clues.values()].map((clue) => ({
                id: clue.id,
                roomId: clue.roomId,
                discovered: clue.discovered,
                text: clue.discovered ? clue.text : undefined,
            })),
        };
    }
}
exports.World = World;
//# sourceMappingURL=world.js.map