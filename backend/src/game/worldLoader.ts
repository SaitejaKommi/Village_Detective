import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { RoomState } from '../../../shared/types'

const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  adjacent: z.array(z.string()),
})

const WorldFileSchema = z.object({
  rooms: z.array(RoomSchema),
})

export function loadWorldData(dataDir: string): RoomState[] {
  const raw = JSON.parse(fs.readFileSync(path.join(dataDir, 'world.json'), 'utf8')) as unknown
  return WorldFileSchema.parse(raw).rooms
}
