"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqProvider = void 0;
class GroqProvider {
    apiKey;
    model;
    name = 'groq';
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }
    async complete({ messages, maxTokens = 256, temperature = 0.7 }) {
        if (!this.apiKey)
            throw new Error('GROQ_API_KEY is not set');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                max_tokens: maxTokens,
                temperature,
            }),
        });
        if (!response.ok)
            throw new Error(`Groq ${response.status}: ${await response.text()}`);
        const data = (await response.json());
        return data.choices?.[0]?.message?.content ?? '';
    }
}
exports.GroqProvider = GroqProvider;
//# sourceMappingURL=groq.js.map