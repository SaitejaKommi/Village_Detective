import fs from 'node:fs'
import path from 'node:path'
import { PersonaSchema, type Persona } from '../agents/persona'

export function loadPersonas(dataDir: string): Map<string, Persona> {
  const raw = JSON.parse(fs.readFileSync(path.join(dataDir, 'personas.json'), 'utf8')) as {
    personas?: unknown[]
  }
  const personas = (raw.personas ?? []).map((entry) => PersonaSchema.parse(entry))
  return new Map(personas.map((persona) => [persona.id, persona]))
}
