import type { CompletionRequest, LLMProvider } from './provider'

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini'

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete({ messages, maxTokens = 256, temperature = 0.7 }: CompletionRequest): Promise<string> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is not set')

    const system = messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n')
    const user = messages.filter((message) => message.role === 'user').map((message) => message.content).join('\n')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        }),
      },
    )

    if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`)

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
  }
}
