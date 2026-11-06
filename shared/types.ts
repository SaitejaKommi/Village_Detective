export type Difficulty = 'easy' | 'medium' | 'hard'

export type ErrorCode =
  | 'INVALID_MESSAGE'
  | 'NO_ACTIVE_CASE'
  | 'CASE_ALREADY_STARTED'
  | 'CASE_ALREADY_SOLVED'
  | 'INSUFFICIENT_DIAMONDS'
  | 'HINT_CAP_REACHED'
  | 'RATE_LIMITED'
  | 'NPC_NOT_FOUND'
  | 'CLUE_NOT_FOUND'
  | 'INVALID_MOVE'

export type HintTier = 'direction' | 'location' | 'contradiction'

export type DiamondReason = 'hint' | 'reward'

export const MAX_TALK_LENGTH = 300
export const STARTING_DIAMONDS = 3

export type Position = {
  x: number
  y: number
}

export type RoomState = {
  id: string
  name: string
  adjacent: string[]
}

export type PlayerState = {
  id: string
  roomId: string
  position: Position
}

export type NpcState = {
  id: string
  name: string
  roomId: string
  position: Position
  mood?: string
}

export type ClueState = {
  id: string
  roomId: string
  discovered: boolean
  text?: string
}

export type SuspectInfo = {
  id: string
  name: string
  role: string
  portraitId?: string
}

export type Briefing = {
  title: string
  victimId: string
  victimName: string
  scene: string
  summary: string
}

export type TimelineEvent = {
  time: number
  place: string
  actorId: string
  text: string
}

export type JoinMessage = {
  type: 'join'
  playerId?: string
  sessionId?: string
}

export type MoveMessage = {
  type: 'move'
  dx: number
  dy: number
  /** The room the client says the player is now in. The server checks it is the same or an adjacent room. */
  roomId?: string
}

export type TalkMessage = {
  type: 'talk'
  npcId: string
  text: string
}

export type InspectMessage = {
  type: 'inspect'
  clueId: string
}

export type AccuseMessage = {
  type: 'accuse'
  npcId: string
}

export type GetProfileMessage = {
  type: 'get_profile'
}

export type StartCaseMessage = {
  type: 'start_case'
  difficulty: Difficulty
}

export type HintRequestMessage = {
  type: 'hint_request'
}

export type ClientMessage =
  | JoinMessage
  | MoveMessage
  | TalkMessage
  | InspectMessage
  | AccuseMessage
  | GetProfileMessage
  | StartCaseMessage
  | HintRequestMessage

export type SessionMessage = {
  type: 'session'
  sessionId: string
  playerId: string
}

export type StateMessage = {
  type: 'state'
  tick: number
  clock: number
  player: PlayerState
  npcs: NpcState[]
  clues: ClueState[]
}

export type NpcSayMessage = {
  type: 'npc_say'
  npcId: string
  text: string
  mood?: string
}

export type EventMessage = {
  type: 'event'
  kind: 'murder' | 'clue' | 'info'
  text: string
}

export type DebugMessage = {
  type: 'debug'
  npcId: string
  perception: string
  memory: string[]
  thought: string
}

export type GameOverMessage = {
  type: 'game_over'
  won: boolean
  killerId: string
  timeline: TimelineEvent[]
  secrets: Record<string, string>
  /** Diamonds granted for this win (0 if lost or already granted). The new balance follows in `diamonds_update`. */
  reward: number
}

export type ErrorMessage = {
  type: 'error'
  code: ErrorCode
  message: string
}

export type ProfileMessage = {
  type: 'profile'
  playerId: string
  diamonds: number
  casesSolved: number
  outfitId: string
}

export type CaseStartedMessage = {
  type: 'case_started'
  caseId: string
  difficulty: Difficulty
  briefing: Briefing
  rooms: RoomState[]
  suspects: SuspectInfo[]
}

export type HintMessage = {
  type: 'hint'
  tier: HintTier
  text: string
  cost: number
  diamonds: number
  hintsLeft: number
}

export type DiamondsUpdateMessage = {
  type: 'diamonds_update'
  balance: number
  reason: DiamondReason
}

export type ServerMessage =
  | SessionMessage
  | StateMessage
  | NpcSayMessage
  | EventMessage
  | DebugMessage
  | GameOverMessage
  | ErrorMessage
  | ProfileMessage
  | CaseStartedMessage
  | HintMessage
  | DiamondsUpdateMessage
