"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
const node_path_1 = __importDefault(require("node:path"));
exports.config = {
    port: Number(process.env.PORT ?? 8080),
    tickMs: Number(process.env.TICK_MS ?? 1000),
    dbPath: process.env.DB_PATH ?? node_path_1.default.join(process.cwd(), 'data', 'village.db'),
    dataDir: process.env.DATA_DIR ?? node_path_1.default.join(process.cwd(), 'data'),
    groqApiKey: process.env.GROQ_API_KEY ?? '',
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    groqModel: process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    debugAgents: process.env.DEBUG_AGENTS === 'true',
};
//# sourceMappingURL=config.js.map