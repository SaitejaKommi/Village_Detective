// The wire protocol is owned by the backend: shared/types.ts. Messages are FLAT, for example
// { type: 'join', playerId } and { type: 'npc_say', npcId, text }. There is no payload envelope.
// This file only re-exports those types and adds a few client-side helpers.
import type { ClientMessage, ServerMessage } from '@shared/types';

export type {
  AccuseMessage, Briefing, CaseStartedMessage, ClientMessage, ClueState, DebugMessage, Difficulty,
  DiamondsUpdateMessage, ErrorCode, ErrorMessage, EventMessage, GameOverMessage, HintMessage, HintRequestMessage,
  InspectMessage, JoinMessage, MoveMessage, NpcSayMessage, NpcState, ProfileMessage, RoomState,
  ServerMessage, SessionMessage, StartCaseMessage, StateMessage, SuspectInfo, TalkMessage, TimelineEvent,
} from '@shared/types';

export type ServerType = ServerMessage['type'];
/** The whole message for a given type (flat protocol, so there is no separate payload). */
export type ServerMsg<T extends ServerType> = Extract<ServerMessage, { type: T }>;
export type ClientType = ClientMessage['type'];

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline';
