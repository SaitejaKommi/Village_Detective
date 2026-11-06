import { z } from 'zod'
import { MAX_TALK_LENGTH } from '../../../shared/types'

const JoinSchema = z.object({
  type: z.literal('join'),
  playerId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
})

const MoveSchema = z.object({
  type: z.literal('move'),
  dx: z.number().int().min(-1).max(1),
  dy: z.number().int().min(-1).max(1),
})

const TalkSchema = z.object({
  type: z.literal('talk'),
  npcId: z.string().min(1),
  text: z.string().min(1).max(MAX_TALK_LENGTH),
})

const InspectSchema = z.object({
  type: z.literal('inspect'),
  clueId: z.string().min(1),
})

const AccuseSchema = z.object({
  type: z.literal('accuse'),
  npcId: z.string().min(1),
})

const GetProfileSchema = z.object({
  type: z.literal('get_profile'),
})

const StartCaseSchema = z.object({
  type: z.literal('start_case'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
})

const HintRequestSchema = z.object({
  type: z.literal('hint_request'),
})

export const ClientMessageSchema = z.discriminatedUnion('type', [
  JoinSchema,
  MoveSchema,
  TalkSchema,
  InspectSchema,
  AccuseSchema,
  GetProfileSchema,
  StartCaseSchema,
  HintRequestSchema,
])
