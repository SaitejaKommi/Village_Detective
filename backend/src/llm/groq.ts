import type { CompletionRequest, LLMProvider } from './provider'

export class GroqProvider implements LLMProvider {
  readonly name = 'groq'

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete({ messages, maxTokens = 256, temperature = 0.7 }: CompletionRequest): Promise<string> {
    if (!this.apiKey) throw new Error('GROQ_API_KEY is not set')

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    })

    if (!response.ok) throw new Error(`Groq ${response.status}: ${await response.text()}`)

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return data.choices?.[0]?.message?.content ?? ''
  }
}
