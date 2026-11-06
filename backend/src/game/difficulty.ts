import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { Difficulty } from '../../../shared/types'

export const DifficultyConfigSchema = z.object({
  id: z.enum(['easy', 'medium', 'hard']),
  label: z.string(),
  npcCooperation: z.number().min(0).max(1),
  lieTendency: z.number().min(0).max(1),
  redHerrings: z.number().int().min(0),
  clueVisibility: z.enum(['low', 'medium', 'high']),
  maxHints: z.number().int().min(0),
  rewardDiamonds: z.number().int().min(0),
})

export type DifficultyConfig = z.infer<typeof DifficultyConfigSchema>

export function loadDifficulty(dataDir: string): Map<Difficulty, DifficultyConfig> {
  const raw = JSON.parse(fs.readFileSync(path.join(dataDir, 'difficulty.json'), 'utf8')) as unknown[]
  const configs = raw.map((entry) => DifficultyConfigSchema.parse(entry))
  return new Map(configs.map((config) => [config.id, config]))
}
