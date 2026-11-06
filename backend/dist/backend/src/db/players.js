"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayer = getPlayer;
exports.createPlayer = createPlayer;
exports.ensurePlayer = ensurePlayer;
exports.deductDiamond = deductDiamond;
const node_crypto_1 = require("node:crypto");
const types_1 = require("../../../shared/types");
function getPlayer(db, id) {
    return db
        .prepare('SELECT id, diamonds, cases_solved, outfit_id, created_at FROM players WHERE id = ?')
        .get(id);
}
function createPlayer(db, id) {
    db.prepare('INSERT INTO players (id, diamonds, cases_solved, outfit_id, created_at) VALUES (?, ?, 0, ?, ?)').run(id, types_1.STARTING_DIAMONDS, 'default', Date.now());
    return getPlayer(db, id);
}
function ensurePlayer(db, id) {
    if (id) {
        const existing = getPlayer(db, id);
        if (existing)
            return existing;
    }
    return createPlayer(db, id ?? (0, node_crypto_1.randomUUID)());
}
function deductDiamond(db, id) {
    const result = db
        .prepare('UPDATE players SET diamonds = diamonds - 1 WHERE id = ? AND diamonds >= 1')
        .run(id);
    return result.changes === 1;
}
//# sourceMappingURL=players.js.map