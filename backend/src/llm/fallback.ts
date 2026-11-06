import type { CompletionRequest, LLMProvider } from './provider'

export class FallbackProvider implements LLMProvider {
  readonly name = 'fallback'

  constructor(private readonly providers: LLMProvider[]) {}

  async complete(request: CompletionRequest): Promise<string> {
    let lastError: unknown
    for (const provider of this.providers) {
      try {
        return await provider.complete(request)
      } catch (error) {
        lastError = error
      }
    }
    throw lastError instanceof Error ? lastError : new Error('All LLM providers failed')
  }
}

export class ScriptedProvider implements LLMProvider {
  readonly name = 'scripted'

  async complete(): Promise<string> {
    return '{"action":"idle","thought":"provider unavailable"}'
  }
}
