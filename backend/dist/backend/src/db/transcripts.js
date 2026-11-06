"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertTranscript = insertTranscript;
exports.listTranscripts = listTranscripts;
function insertTranscript(db, caseRunId, npcId, speaker, text) {
    db.prepare('INSERT INTO transcripts (case_run_id, npc_id, speaker, text, created_at) VALUES (?, ?, ?, ?, ?)').run(caseRunId, npcId, speaker, text, Date.now());
}
function listTranscripts(db, caseRunId) {
    return db
        .prepare('SELECT * FROM transcripts WHERE case_run_id = ? ORDER BY id ASC')
        .all(caseRunId);
}
//# sourceMappingURL=transcripts.js.map