import type { Agent } from '../agents/agent'
import { World } from '../world/world'
import type { CaseFile } from './caseLoader'
import type { DifficultyConfig } from './difficulty'
import type { HintService } from './hints'

export class GameSession {
  readonly world = new World()
  caseFile: CaseFile | null = null
  difficulty: DifficultyConfig | null = null
  caseRunId: string | null = null
  hintService: HintService | null = null
  agents = new Map<string, Agent>()
  solved = false
  ambientBusy = false

  constructor(
    readonly id: string,
    readonly playerId: string,
  ) {}
}
