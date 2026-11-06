import { z } from 'zod'

export const AgentOutputSchema = z.object({
  action: z.enum(['move', 'say', 'gossip', 'inspect', 'idle']),
  target: z.string().min(1).optional(),
  say: z.string().max(300).optional(),
  thought: z.string().max(500).optional(),
})

export type AgentOutput = z.infer<typeof AgentOutputSchema>
