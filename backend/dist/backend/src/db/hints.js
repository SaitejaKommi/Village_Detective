"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logHint = logHint;
exports.countHints = countHints;
function logHint(db, caseRunId, tier, cost) {
    db.prepare('INSERT INTO hint_log (case_run_id, tier, cost, created_at) VALUES (?, ?, ?, ?)').run(caseRunId, tier, cost, Date.now());
}
function countHints(db, caseRunId) {
    const row = db.prepare('SELECT COUNT(*) AS count FROM hint_log WHERE case_run_id = ?').get(caseRunId);
    return row.count;
}
//# sourceMappingURL=hints.js.map