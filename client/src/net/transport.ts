import type { ClientMessage, ConnectionStatus, ServerMessage } from './protocol';

/** The one interface the game talks to. The mock and the real WebSocket both implement it. */
export interface Transport {
  connect(): void;
  send(msg: ClientMessage): void;
  close(): void;
  /** Optional manual retry after going offline. */
  retry?(): void;
  onMessage(cb: (msg: ServerMessage) => void): void;
  onStatus(cb: (s: ConnectionStatus) => void): void;
}

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';
export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

/** Config switch: mock (default) or real WebSocket. The mock is loaded lazily so it stays out of real builds' hot path. */
export async function createTransport(): Promise<Transport> {
  if (USE_MOCK) {
    const { MockTransport } = await import('../mock/mockServer');
    return new MockTransport();
  }
  const { WsTransport } = await import('./wsTransport');
  return new WsTransport(WS_URL);
}
