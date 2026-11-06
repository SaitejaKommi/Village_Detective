"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickSessions = tickSessions;
const broadcast_1 = require("../net/broadcast");
const engine_1 = require("./engine");
function tickSessions(ctx) {
    for (const session of ctx.sessions.values()) {
        if (!session.caseFile || session.solved)
            continue;
        session.world.tick += 1;
        session.world.clock += 1;
        (0, engine_1.runAmbient)(ctx, session);
        (0, broadcast_1.sendState)(ctx, session);
    }
}
//# sourceMappingURL=tick.js.map