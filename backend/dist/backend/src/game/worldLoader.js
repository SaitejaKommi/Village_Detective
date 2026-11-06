"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadWorldData = loadWorldData;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const RoomSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    adjacent: zod_1.z.array(zod_1.z.string()),
});
const WorldFileSchema = zod_1.z.object({
    rooms: zod_1.z.array(RoomSchema),
});
function loadWorldData(dataDir) {
    const raw = JSON.parse(node_fs_1.default.readFileSync(node_path_1.default.join(dataDir, 'world.json'), 'utf8'));
    return WorldFileSchema.parse(raw).rooms;
}
//# sourceMappingURL=worldLoader.js.map