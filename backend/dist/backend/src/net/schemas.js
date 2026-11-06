"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientMessageSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../../../shared/types");
const JoinSchema = zod_1.z.object({
    type: zod_1.z.literal('join'),
    playerId: zod_1.z.string().uuid().optional(),
    sessionId: zod_1.z.string().uuid().optional(),
});
const MoveSchema = zod_1.z.object({
    type: zod_1.z.literal('move'),
    dx: zod_1.z.number().int().min(-1).max(1),
    dy: zod_1.z.number().int().min(-1).max(1),
});
const TalkSchema = zod_1.z.object({
    type: zod_1.z.literal('talk'),
    npcId: zod_1.z.string().min(1),
    text: zod_1.z.string().min(1).max(types_1.MAX_TALK_LENGTH),
});
const InspectSchema = zod_1.z.object({
    type: zod_1.z.literal('inspect'),
    clueId: zod_1.z.string().min(1),
});
const AccuseSchema = zod_1.z.object({
    type: zod_1.z.literal('accuse'),
    npcId: zod_1.z.string().min(1),
});
const GetProfileSchema = zod_1.z.object({
    type: zod_1.z.literal('get_profile'),
});
const StartCaseSchema = zod_1.z.object({
    type: zod_1.z.literal('start_case'),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
});
const HintRequestSchema = zod_1.z.object({
    type: zod_1.z.literal('hint_request'),
});
exports.ClientMessageSchema = zod_1.z.discriminatedUnion('type', [
    JoinSchema,
    MoveSchema,
    TalkSchema,
    InspectSchema,
    AccuseSchema,
    GetProfileSchema,
    StartCaseSchema,
    HintRequestSchema,
]);
//# sourceMappingURL=schemas.js.map