"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeClues = placeClues;
const VISIBILITY_RANK = { low: 0, medium: 1, high: 2 };
function placeClues(world, caseFile, difficulty) {
    for (const clue of caseFile.clues) {
        if (VISIBILITY_RANK[clue.visibility] > VISIBILITY_RANK[difficulty.clueVisibility])
            continue;
        world.clues.set(clue.id, {
            id: clue.id,
            roomId: clue.roomId,
            text: clue.text,
            discovered: false,
            relatedTo: clue.relatedTo,
        });
    }
    for (const redHerring of caseFile.redHerrings.slice(0, difficulty.redHerrings)) {
        world.clues.set(redHerring.id, {
            id: redHerring.id,
            roomId: redHerring.roomId,
            text: redHerring.text,
            discovered: false,
        });
    }
}
//# sourceMappingURL=clues.js.map