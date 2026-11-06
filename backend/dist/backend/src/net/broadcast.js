"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = send;
exports.sendToSession = sendToSession;
exports.sendState = sendState;
function send(conn, message) {
    if (conn.socket.readyState === 1)
        conn.socket.send(JSON.stringify(message));
}
function sendToSession(ctx, sessionId, message) {
    for (const conn of ctx.connections) {
        if (conn.sessionId !== sessionId)
            continue;
        send(conn, message);
    }
}
function sendState(ctx, session) {
    sendToSession(ctx, session.id, { type: 'state', ...session.world.toState() });
}
//# sourceMappingURL=broadcast.js.map