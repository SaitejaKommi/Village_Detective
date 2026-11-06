import type { World } from '../world/world'
import type { CaseFile } from './caseLoader'
import type { DifficultyConfig } from './difficulty'

const VISIBILITY_RANK = { low: 0, medium: 1, high: 2 } as const

export function placeClues(world: World, caseFile: CaseFile, difficulty: DifficultyConfig): void {
  for (const clue of caseFile.clues) {
    if (VISIBILITY_RANK[clue.visibility] > VISIBILITY_RANK[difficulty.clueVisibility]) continue
    world.clues.set(clue.id, {
      id: clue.id,
      roomId: clue.roomId,
      text: clue.text,
      discovered: false,
      relatedTo: clue.relatedTo,
    })
  }

  for (const redHerring of caseFile.redHerrings.slice(0, difficulty.redHerrings)) {
    world.clues.set(redHerring.id, {
      id: redHerring.id,
      roomId: redHerring.roomId,
      text: redHerring.text,
      discovered: false,
    })
  }
}
