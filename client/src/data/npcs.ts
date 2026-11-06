// All NPC presentation data lives here so it is easy to change.
// Names and roles are drafts from the Character Bible. The server owns personas and secrets.

export type NpcId = 'alistair' | 'evelyn' | 'julian' | 'harold' | 'margaret' | 'victor';

export interface NpcDef {
  id: NpcId;
  name: string;
  short: string;
  role: string;
  appearance: string;
  /** In-world sprite body colour and the silhouette prop that tells NPCs apart. */
  color: number;
  prop: 'cane' | 'pearls' | 'tie' | 'gloves' | 'keys' | 'ring';
  /** Starting room (used by the mock only). */
  home: string;
}

export const NPCS: Record<NpcId, NpcDef> = {
  alistair: {
    id: 'alistair', name: 'Alistair Blackwood', short: 'Alistair', role: 'Head of the house',
    appearance: 'Late 60s. Charcoal three-piece suit, silver pocket watch, cane.',
    color: 0x4a4a52, prop: 'cane', home: 'study',
  },
  evelyn: {
    id: 'evelyn', name: 'Evelyn Blackwood', short: 'Evelyn', role: 'His wife',
    appearance: 'Mid 40s. Black evening gown, pearl choker, long gloves.',
    color: 0x7a2236, prop: 'pearls', home: 'library',
  },
  julian: {
    id: 'julian', name: 'Julian Blackwood', short: 'Julian', role: 'Their son',
    appearance: 'Late 20s. Rumpled dark blazer, loosened tie, tired eyes.',
    color: 0x3a5f8a, prop: 'tie', home: 'garden',
  },
  harold: {
    id: 'harold', name: 'Harold Finch', short: 'Harold', role: 'The butler',
    appearance: '60s. Immaculate tailcoat, white gloves, straight posture.',
    color: 0x3a3a40, prop: 'gloves', home: 'dining',
  },
  margaret: {
    id: 'margaret', name: 'Margaret Doyle', short: 'Margaret', role: 'The housekeeper',
    appearance: '50s. Dark dress, apron, ring of keys at the belt.',
    color: 0x5f8a5a, prop: 'keys', home: 'kitchen',
  },
  victor: {
    id: 'victor', name: 'Victor Crane', short: 'Victor', role: 'Business partner',
    appearance: '50s. Double-breasted pinstripe suit, slicked hair, pinky ring.',
    color: 0x8a742f, prop: 'ring', home: 'foyer',
  },
};

export const VICTIM_ID: NpcId = 'alistair';
export const SUSPECT_IDS: NpcId[] = ['evelyn', 'julian', 'harold', 'margaret', 'victor'];

export function npcDef(id: string): NpcDef | undefined {
  return (NPCS as Record<string, NpcDef | undefined>)[id];
}
export function npcName(id: string): string {
  return npcDef(id)?.name ?? id;
}
