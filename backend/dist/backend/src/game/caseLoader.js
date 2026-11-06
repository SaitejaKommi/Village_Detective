"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseFileSchema = void 0;
exports.loadCaseFile = loadCaseFile;
exports.buildCase = buildCase;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const agent_1 = require("../agents/agent");
const clues_1 = require("./clues");
const TimelineEntrySchema = zod_1.z.object({
    time: zod_1.z.number(),
    place: zod_1.z.string(),
    actorId: zod_1.z.string(),
    text: zod_1.z.string(),
});
const ClueSchema = zod_1.z.object({
    id: zod_1.z.string(),
    roomId: zod_1.z.string(),
    text: zod_1.z.string(),
    relatedTo: zod_1.z.string().optional(),
    visibility: zod_1.z.enum(['low', 'medium', 'high']).default('medium'),
});
const RedHerringSchema = zod_1.z.object({
    id: zod_1.z.string(),
    roomId: zod_1.z.string(),
    text: zod_1.z.string(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
});
const NpcSeedSchema = zod_1.z.object({
    npcId: zod_1.z.string(),
    memories: zod_1.z.array(zod_1.z.string()).default([]),
});
const HintTemplateSchema = zod_1.z.object({
    tier: zod_1.z.enum(['direction', 'location', 'contradiction']),
    template: zod_1.z.string(),
});
exports.CaseFileSchema = zod_1.z.object({
    caseId: zod_1.z.string(),
    title: zod_1.z.string(),
    victimId: zod_1.z.string(),
    killerId: zod_1.z.string(),
    scene: zod_1.z.string(),
    summary: zod_1.z.string(),
    coverStory: zod_1.z.string(),
    timeline: zod_1.z.array(TimelineEntrySchema).default([]),
    clues: zod_1.z.array(ClueSchema).default([]),
    npcSeeds: zod_1.z.array(NpcSeedSchema).default([]),
    redHerrings: zod_1.z.array(RedHerringSchema).default([]),
    hintTemplates: zod_1.z.array(HintTemplateSchema).default([]),
});
function loadCaseFile(dataDir) {
    const raw = JSON.parse(node_fs_1.default.readFileSync(node_path_1.default.join(dataDir, 'case.json'), 'utf8'));
    return exports.CaseFileSchema.parse(raw);
}
function buildCase(world, caseFile, difficulty, personas, rooms, playerId) {
    world.reset();
    world.loadRooms(rooms);
    world.activeCaseId = caseFile.caseId;
    for (const event of caseFile.timeline) {
        world.truth.append({
            t: event.time,
            kind: 'murder',
            text: event.text,
            actorId: event.actorId,
        });
    }
    const agents = new Map();
    const suspects = [];
    let roomIndex = 0;
    for (const persona of personas.values()) {
        if (persona.id === caseFile.victimId)
            continue;
        const agent = new agent_1.Agent(persona, difficulty);
        for (const memory of persona.seedMemories)
            agent.memory.add(memory, 0, 2);
        const seeds = caseFile.npcSeeds.find((seed) => seed.npcId === persona.id);
        for (const memory of seeds?.memories ?? [])
            agent.memory.add(memory, 0, 3);
        agents.set(persona.id, agent);
        const room = rooms[roomIndex % rooms.length];
        roomIndex += 1;
        world.npcs.set(persona.id, {
            id: persona.id,
            personaId: persona.id,
            name: persona.name,
            roomId: room.id,
            position: { x: 1 + (roomIndex % 4), y: 1 + (roomIndex % 3) },
        });
        suspects.push({
            id: persona.id,
            name: persona.name,
            role: persona.role,
            portraitId: persona.portraitId,
        });
    }
    const killer = agents.get(caseFile.killerId);
    if (killer)
        killer.memory.add(caseFile.coverStory, 0, 5);
    (0, clues_1.placeClues)(world, caseFile, difficulty);
    world.player = {
        id: playerId,
        roomId: rooms[0].id,
        position: { x: 0, y: 0 },
    };
    return {
        briefing: {
            title: caseFile.title,
            victimId: caseFile.victimId,
            victimName: personas.get(caseFile.victimId)?.name ?? caseFile.victimId,
            scene: caseFile.scene,
            summary: caseFile.summary,
        },
        suspects,
        rooms,
        agents,
    };
}
//# sourceMappingURL=caseLoader.js.map