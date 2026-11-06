export type MemoryEntry = {
  t: number
  text: string
  importance: number
}

export class MemoryStore {
  private readonly entries: MemoryEntry[] = []

  add(text: string, t: number, importance = 1): void {
    this.entries.push({ t, text, importance })
  }

  all(): MemoryEntry[] {
    return [...this.entries]
  }

  retrieve(query: string, k = 5): MemoryEntry[] {
    const queryWords = new Set(tokenize(query))
    return this.entries
      .map((entry, index) => {
        const words = new Set(tokenize(entry.text))
        let overlap = 0
        for (const word of queryWords) if (words.has(word)) overlap += 1
        const recency = index / Math.max(1, this.entries.length)
        const score = overlap * 2 + recency + entry.importance * 0.1
        return { entry, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(({ entry }) => entry)
  }
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}
