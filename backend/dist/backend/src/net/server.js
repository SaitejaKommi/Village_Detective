"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const node_crypto_1 = require("node:crypto");
const ws_1 = require("ws");
const tick_1 = require("../game/tick");
const handlers_1 = require("./handlers");
function createServer(ctx) {
    const wss = new ws_1.WebSocketServer({ port: ctx.port });
    wss.on('connection', (socket) => {
        const conn = {
            id: (0, node_crypto_1.randomUUID)(),
            socket,
            lastTalkAt: 0,
            lastHintAt: 0,
        };
        ctx.connections.add(conn);
        socket.on('message', (data) => {
            void (0, handlers_1.handleMessage)(ctx, conn, data.toString());
        });
        socket.on('close', () => {
            ctx.connections.delete(conn);
        });
        socket.on('error', () => {
            ctx.connections.delete(conn);
        });
    });
    const timer = setInterval(() => (0, tick_1.tickSessions)(ctx), ctx.tickMs);
    wss.on('close', () => clearInterval(timer));
    return wss;
}
//# sourceMappingURL=server.js.map