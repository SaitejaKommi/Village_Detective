"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonaSchema = exports.RelationshipSchema = void 0;
const zod_1 = require("zod");
exports.RelationshipSchema = zod_1.z.object({
    npcId: zod_1.z.string(),
    attitude: zod_1.z.string(),
    knowsAbout: zod_1.z.string().optional(),
});
exports.PersonaSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    role: zod_1.z.string(),
    appearance: zod_1.z.string(),
    voiceStyle: zod_1.z.string(),
    goal: zod_1.z.string(),
    secret: zod_1.z.string(),
    motiveToLie: zod_1.z.string(),
    relationships: zod_1.z.array(exports.RelationshipSchema).default([]),
    seedMemories: zod_1.z.array(zod_1.z.string()).default([]),
    portraitId: zod_1.z.string().optional(),
    spriteColor: zod_1.z.string().optional(),
});
//# sourceMappingURL=persona.js.map