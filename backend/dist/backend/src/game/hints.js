"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HintService = void 0;
class HintService {
    caseFile;
    maxHints;
    used = 0;
    constructor(caseFile, maxHints) {
        this.caseFile = caseFile;
        this.maxHints = maxHints;
    }
    remaining() {
        return Math.max(0, this.maxHints - this.used);
    }
    hasNext() {
        return this.used < this.maxHints && this.used < this.caseFile.hintTemplates.length;
    }
    next() {
        if (!this.hasNext())
            return null;
        const template = this.caseFile.hintTemplates[this.used];
        this.used += 1;
        return { tier: template.tier, text: template.template };
    }
}
exports.HintService = HintService;
//# sourceMappingURL=hints.js.map