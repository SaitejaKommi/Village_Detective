export type TruthEntry = {
  t: number
  kind: string
  text: string
  actorId?: string
}

export class TruthLog {
  private readonly entries: TruthEntry[] = []

  append(entry: TruthEntry): void {
    this.entries.push(entry)
  }

  snapshot(): TruthEntry[] {
    return [...this.entries]
  }
}
