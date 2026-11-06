import type { CaseFile } from './caseLoader'

export type AccusationResult = {
  won: boolean
  killerId: string
}

export function resolveAccusation(accusedId: string, caseFile: CaseFile): AccusationResult {
  return {
    won: accusedId === caseFile.killerId,
    killerId: caseFile.killerId,
  }
}
