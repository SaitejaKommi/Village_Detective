"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruthLog = void 0;
class TruthLog {
    entries = [];
    append(entry) {
        this.entries.push(entry);
    }
    snapshot() {
        return [...this.entries];
    }
}
exports.TruthLog = TruthLog;
//# sourceMappingURL=truthLog.js.map