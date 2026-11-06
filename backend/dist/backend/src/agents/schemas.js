"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOutputSchema = void 0;
const zod_1 = require("zod");
exports.AgentOutputSchema = zod_1.z.object({
    action: zod_1.z.enum(['move', 'say', 'gossip', 'inspect', 'idle']),
    target: zod_1.z.string().min(1).optional(),
    say: zod_1.z.string().max(300).optional(),
    thought: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=schemas.js.map