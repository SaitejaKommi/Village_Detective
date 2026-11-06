"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStore = void 0;
class MemoryStore {
    entries = [];
    add(text, t, importance = 1) {
        this.entries.push({ t, text, importance });
    }
    all() {
        return [...this.entries];
    }
    retrieve(query, k = 5) {
        const queryWords = new Set(tokenize(query));
        return this.entries
            .map((entry, index) => {
            const words = new Set(tokenize(entry.text));
            let overlap = 0;
            for (const word of queryWords)
                if (words.has(word))
                    overlap += 1;
            const recency = index / Math.max(1, this.entries.length);
            const score = overlap * 2 + recency + entry.importance * 0.1;
            return { entry, score };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, k)
            .map(({ entry }) => entry);
    }
}
exports.MemoryStore = MemoryStore;
function tokenize(text) {
    return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}
//# sourceMappingURL=memory.js.map