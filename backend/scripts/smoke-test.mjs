import assert from 'node:assert/strict'
import WebSocket from 'ws'

const url = process.env.WS_URL ?? 'ws://127.0.0.1:8080'
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 12000)

const queue = []
const waiters = []
const ws = new WebSocket(url)

ws.on('message', (raw) => {
  const message = JSON.parse(raw.toString())
  const index = waiters.findIndex((waiter) => waiter.predicate(message))
  if (index >= 0) {
    const [waiter] = waiters.splice(index, 1)
    clearTimeout(waiter.timer)
    waiter.resolve(message)
    return
  }
  queue.push(message)
})

ws.on('error', (error) => {
  for (const waiter of waiters.splice(0)) {
    clearTimeout(waiter.timer)
    waiter.reject(error)
  }
})

function next(predicate, label) {
  const queued = queue.findIndex(predicate)
  if (queued >= 0) {
    return Promise.resolve(queue.splice(queued, 1)[0])
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const index = waiters.findIndex((waiter) => waiter.timer === timer)
      if (index >= 0) waiters.splice(index, 1)
      reject(new Error(`Timed out waiting for ${label}`))
    }, timeoutMs)
    waiters.push({ predicate, resolve, reject, timer })
  })
}

function send(message) {
  ws.send(JSON.stringify(message))
}

await new Promise((resolve, reject) => {
  ws.once('open', resolve)
  ws.once('error', reject)
})

send({ type: 'join' })
const session = await next((m) => m.type === 'session', 'session')
assert.equal(typeof session.playerId, 'string')
assert.equal(typeof session.sessionId, 'string')

send({ type: 'get_profile' })
const profile = await next((m) => m.type === 'profile', 'profile')
assert.equal(profile.diamonds, 3)
assert.equal(profile.casesSolved, 0)

send({ type: 'start_case', difficulty: 'easy' })
const started = await next((m) => m.type === 'case_started', 'case_started')
const initialState = await next(
  (m) => m.type === 'state' && m.player.roomId === 'foyer',
  'initial state',
)
assert.equal(started.caseId, 'blackwood-manor')
assert.equal(started.suspects.length, 5)
assert.equal(initialState.player.roomId, 'foyer')

send({ type: 'inspect', clueId: 'muddy_footprints' })
const clueEvent = await next((m) => m.type === 'event' && m.kind === 'clue', 'clue event')
assert.match(clueEvent.text, /footprints/i)
const inspectedState = await next(
  (m) =>
    m.type === 'state' &&
    m.clues.some((clue) => clue.id === 'muddy_footprints' && clue.discovered === true),
  'state with discovered clue',
)
assert.match(
  inspectedState.clues.find((clue) => clue.id === 'muddy_footprints').text,
  /footprints/i,
)

send({ type: 'talk', npcId: 'evelyn', text: 'Where were you at midnight?' })
const reply = await next((m) => m.type === 'npc_say', 'npc_say')
assert.equal(reply.npcId, 'evelyn')
assert.ok(reply.text.length > 0)

send({ type: 'hint_request' })
const hint = await next((m) => m.type === 'hint', 'hint')
assert.equal(hint.cost, 1)
assert.equal(hint.diamonds, 2)
assert.equal(hint.hintsLeft, 3)

send({ type: 'hint_request' })
const rateLimited = await next((m) => m.type === 'error', 'hint rate limit')
assert.equal(rateLimited.code, 'RATE_LIMITED')

send({ type: 'move', dx: 99, dy: 0 })
const invalid = await next((m) => m.type === 'error', 'invalid message')
assert.equal(invalid.code, 'INVALID_MESSAGE')

send({ type: 'accuse', npcId: 'victor' })
const gameOver = await next((m) => m.type === 'game_over', 'game_over')
const reward = await next(
  (m) => m.type === 'diamonds_update' && m.reason === 'reward',
  'reward',
)
assert.equal(gameOver.won, true)
assert.equal(gameOver.killerId, 'victor')
assert.ok(gameOver.timeline.length > 0)
assert.equal(reward.reason, 'reward')
assert.equal(reward.balance, 3)

ws.close()
console.log(`smoke ok: ${url} (player ${session.playerId})`)
