"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptedProvider = exports.FallbackProvider = void 0;
class FallbackProvider {
    providers;
    name = 'fallback';
    constructor(providers) {
        this.providers = providers;
    }
    async complete(request) {
        let lastError;
        for (const provider of this.providers) {
            try {
                return await provider.complete(request);
            }
            catch (error) {
                lastError = error;
            }
        }
        throw lastError instanceof Error ? lastError : new Error('All LLM providers failed');
    }
}
exports.FallbackProvider = FallbackProvider;
class ScriptedProvider {
    name = 'scripted';
    async complete() {
        return '{"action":"idle","thought":"provider unavailable"}';
    }
}
exports.ScriptedProvider = ScriptedProvider;
//# sourceMappingURL=fallback.js.map