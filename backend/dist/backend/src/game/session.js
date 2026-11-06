"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSession = void 0;
const world_1 = require("../world/world");
class GameSession {
    id;
    playerId;
    world = new world_1.World();
    caseFile = null;
    difficulty = null;
    caseRunId = null;
    hintService = null;
    agents = new Map();
    solved = false;
    ambientBusy = false;
    constructor(id, playerId) {
        this.id = id;
        this.playerId = playerId;
    }
}
exports.GameSession = GameSession;
//# sourceMappingURL=session.js.map