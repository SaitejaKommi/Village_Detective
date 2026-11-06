"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const db_1 = require("./db/db");
const difficulty_1 = require("./game/difficulty");
const personas_1 = require("./game/personas");
const worldLoader_1 = require("./game/worldLoader");
const fallback_1 = require("./llm/fallback");
const gemini_1 = require("./llm/gemini");
const groq_1 = require("./llm/groq");
const queue_1 = require("./llm/queue");
const server_1 = require("./net/server");
const db = (0, db_1.openDatabase)(config_1.config.dbPath);
const llm = new fallback_1.FallbackProvider([
    new groq_1.GroqProvider(config_1.config.groqApiKey, config_1.config.groqModel),
    new gemini_1.GeminiProvider(config_1.config.geminiApiKey, config_1.config.geminiModel),
    new fallback_1.ScriptedProvider(),
]);
const context = {
    db,
    dataDir: config_1.config.dataDir,
    port: config_1.config.port,
    tickMs: config_1.config.tickMs,
    debugAgents: config_1.config.debugAgents,
    rooms: (0, worldLoader_1.loadWorldData)(config_1.config.dataDir),
    personas: (0, personas_1.loadPersonas)(config_1.config.dataDir),
    difficulties: (0, difficulty_1.loadDifficulty)(config_1.config.dataDir),
    llm,
    queue: new queue_1.LLMQueue(200),
    sessions: new Map(),
    connections: new Set(),
};
(0, server_1.createServer)(context);
console.log(`Village of Liars backend listening on ws://localhost:${config_1.config.port}`);
//# sourceMappingURL=index.js.map