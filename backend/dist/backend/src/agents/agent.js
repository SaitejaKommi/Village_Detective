"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const memory_1 = require("./memory");
const prompt_1 = require("./prompt");
const schemas_1 = require("./schemas");
class Agent {
    persona;
    difficulty;
    memory = new memory_1.MemoryStore();
    constructor(persona, difficulty) {
        this.persona = persona;
        this.difficulty = difficulty;
    }
    async decide(perception, llm) {
        const memories = this.memory.retrieve(perception).map((entry) => entry.text);
        const prompt = (0, prompt_1.buildUserPrompt)(memories, perception);
        const system = (0, prompt_1.buildSystemPrompt)(this.persona, this.difficulty);
        const first = await llm.complete({
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: prompt },
            ],
        });
        const parsed = this.parse(first);
        if (parsed)
            return parsed;
        const retry = await llm.complete({
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: `${prompt}\nReturn valid JSON only.` },
            ],
        });
        return this.parse(retry) ?? { action: 'idle' };
    }
    parse(raw) {
        try {
            const start = raw.indexOf('{');
            const end = raw.lastIndexOf('}');
            if (start === -1 || end === -1)
                return null;
            const result = schemas_1.AgentOutputSchema.safeParse(JSON.parse(raw.slice(start, end + 1)));
            return result.success ? result.data : null;
        }
        catch {
            return null;
        }
    }
}
exports.Agent = Agent;
//# sourceMappingURL=agent.js.map