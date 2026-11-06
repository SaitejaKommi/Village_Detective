export type ChatMessage = {
  role: 'system' | 'user'
  content: string
}

export type CompletionRequest = {
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}

export interface LLMProvider {
  readonly name: string
  complete(request: CompletionRequest): Promise<string>
}
