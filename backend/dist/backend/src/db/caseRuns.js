"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCaseRun = createCaseRun;
exports.getCaseRun = getCaseRun;
exports.markLost = markLost;
exports.markWon = markWon;
exports.grantReward = grantReward;
exports.incrementHints = incrementHints;
function createCaseRun(db, id, playerId, caseId, difficulty) {
    db.prepare('INSERT INTO case_runs (id, player_id, case_id, difficulty, result, started_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, playerId, caseId, difficulty, 'in_progress', Date.now());
}
function getCaseRun(db, id) {
    return db.prepare('SELECT * FROM case_runs WHERE id = ?').get(id);
}
function markLost(db, id) {
    db.prepare("UPDATE case_runs SET result = 'lost', ended_at = ? WHERE id = ? AND result = 'in_progress'").run(Date.now(), id);
}
function markWon(db, id) {
    db.prepare("UPDATE case_runs SET result = 'won', ended_at = ? WHERE id = ? AND result = 'in_progress'").run(Date.now(), id);
}
function grantReward(db, runId, playerId, amount) {
    const transaction = db.transaction(() => {
        const marked = db
            .prepare("UPDATE case_runs SET result = 'won', reward_granted = 1, ended_at = ? WHERE id = ? AND reward_granted = 0 AND result = 'in_progress'")
            .run(Date.now(), runId);
        if (marked.changes !== 1)
            return false;
        db.prepare('UPDATE players SET diamonds = diamonds + ?, cases_solved = cases_solved + 1 WHERE id = ?').run(amount, playerId);
        return true;
    });
    return transaction();
}
function incrementHints(db, id) {
    db.prepare('UPDATE case_runs SET hints_used = hints_used + 1 WHERE id = ?').run(id);
}
//# sourceMappingURL=caseRuns.js.map