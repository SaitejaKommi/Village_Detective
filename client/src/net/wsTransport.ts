import type { ClientMessage, ConnectionStatus, ServerMessage } from './protocol';
import type { Transport } from './transport';

const MAX_ATTEMPTS = 8;

/** Real WebSocket transport. Envelope: { type, payload } (DRAFT, see protocol.ts). Reconnects with backoff. */
export class WsTransport implements Transport {
  private ws: WebSocket | null = null;
  private msgCb: (m: ServerMessage) => void = () => {};
  private statusCb: (s: ConnectionStatus) => void = () => {};
  private attempts = 0;
  private timer: number | undefined;
  private closedByUs = false;
  private everOpened = false;
  private queue: ClientMessage[] = [];

  constructor(private url: string) {}

  onMessage(cb: (m: ServerMessage) => void): void { this.msgCb = cb; }
  onStatus(cb: (s: ConnectionStatus) => void): void { this.statusCb = cb; }

  connect(): void {
    this.closedByUs = false;
    this.statusCb(this.everOpened ? 'reconnecting' : 'connecting');
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.scheduleRetry();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.attempts = 0;
      this.everOpened = true;
      this.statusCb('online');
      for (const m of this.queue.splice(0)) this.send(m);
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as ServerMessage;
        if (data && typeof data.type === 'string') this.msgCb(data);
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => { if (!this.closedByUs) this.scheduleRetry(); };
    ws.onerror = () => { /* onclose follows */ };
  }

  private scheduleRetry(): void {
    if (this.attempts >= MAX_ATTEMPTS) { this.statusCb('offline'); return; }
    this.statusCb('reconnecting');
    const delay = Math.min(8000, 600 * 2 ** this.attempts++);
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.connect(), delay);
  }

  send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
    else if (msg.type !== 'move') this.queue.push(msg);
  }

  close(): void {
    this.closedByUs = true;
    window.clearTimeout(this.timer);
    this.ws?.close();
  }

  /** Manual retry after the "offline" state. */
  retry(): void {
    this.attempts = 0;
    this.connect();
  }
}
