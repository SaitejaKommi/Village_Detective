"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPersonas = loadPersonas;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const persona_1 = require("../agents/persona");
function loadPersonas(dataDir) {
    const raw = JSON.parse(node_fs_1.default.readFileSync(node_path_1.default.join(dataDir, 'personas.json'), 'utf8'));
    const personas = (raw.personas ?? []).map((entry) => persona_1.PersonaSchema.parse(entry));
    return new Map(personas.map((persona) => [persona.id, persona]));
}
//# sourceMappingURL=personas.js.map