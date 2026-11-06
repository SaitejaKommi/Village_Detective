import type { HintTier } from '../../../shared/types'
import type { CaseFile } from './caseLoader'

export type Hint = {
  tier: HintTier
  text: string
}

export class HintService {
  private used = 0

  constructor(
    private readonly caseFile: CaseFile,
    private readonly maxHints: number,
  ) {}

  remaining(): number {
    return Math.max(0, this.maxHints - this.used)
  }

  hasNext(): boolean {
    return this.used < this.maxHints && this.used < this.caseFile.hintTemplates.length
  }

  next(): Hint | null {
    if (!this.hasNext()) return null
    const template = this.caseFile.hintTemplates[this.used]
    this.used += 1
    return { tier: template.tier, text: template.template }
  }
}
