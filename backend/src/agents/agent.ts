import type { DifficultyConfig } from '../game/difficulty'
import type { LLMProvider } from '../llm/provider'
import { MemoryStore } from './memory'
import type { Persona } from './persona'
import { buildSystemPrompt, buildUserPrompt } from './prompt'
import { AgentOutputSchema, type AgentOutput } from './schemas'

export class Agent {
  readonly memory = new MemoryStore()

  constructor(
    readonly persona: Persona,
    private readonly difficulty: DifficultyConfig,
  ) {}

  async decide(perception: string, llm: LLMProvider): Promise<AgentOutput> {
    const memories = this.memory.retrieve(perception).map((entry) => entry.text)
    const prompt = buildUserPrompt(memories, perception)
    const system = buildSystemPrompt(this.persona, this.difficulty)

    const first = await llm.complete({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    })
    const parsed = this.parse(first)
    if (parsed) return parsed

    const retry = await llm.complete({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `${prompt}\nReturn valid JSON only.` },
      ],
    })
    return this.parse(retry) ?? { action: 'idle' }
  }

  private parse(raw: string): AgentOutput | null {
    try {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start === -1 || end === -1) return null
      const result = AgentOutputSchema.safeParse(JSON.parse(raw.slice(start, end + 1)))
      return result.success ? result.data : null
    } catch {
      return null
    }
  }
}
