"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAccusation = resolveAccusation;
function resolveAccusation(accusedId, caseFile) {
    return {
        won: accusedId === caseFile.killerId,
        killerId: caseFile.killerId,
    };
}
//# sourceMappingURL=accusation.js.map