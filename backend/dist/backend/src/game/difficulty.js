"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DifficultyConfigSchema = void 0;
exports.loadDifficulty = loadDifficulty;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
exports.DifficultyConfigSchema = zod_1.z.object({
    id: zod_1.z.enum(['easy', 'medium', 'hard']),
    label: zod_1.z.string(),
    npcCooperation: zod_1.z.number().min(0).max(1),
    lieTendency: zod_1.z.number().min(0).max(1),
    redHerrings: zod_1.z.number().int().min(0),
    clueVisibility: zod_1.z.enum(['low', 'medium', 'high']),
    maxHints: zod_1.z.number().int().min(0),
    rewardDiamonds: zod_1.z.number().int().min(0),
});
function loadDifficulty(dataDir) {
    const raw = JSON.parse(node_fs_1.default.readFileSync(node_path_1.default.join(dataDir, 'difficulty.json'), 'utf8'));
    const configs = raw.map((entry) => exports.DifficultyConfigSchema.parse(entry));
    return new Map(configs.map((config) => [config.id, config]));
}
//# sourceMappingURL=difficulty.js.map