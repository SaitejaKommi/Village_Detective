// This file contains the types for the actions that can be performed in the game.
type Join =  {
    sessionId?: string
}

type Move = {
    dx: number
    dy: number
}

type Talk = {
    npcId: string
    text: string
}

type Inspect = {
    clueId: string
}

type Accuse = {
    npcId: string
}

export type Action = Join | Move | Talk | Inspect | Accuse




type Session = {
    sessionId : string
}

type State = {
    tick : number,
    clock : number,
    player : string,
    npcs : string[],
    clues  : string[]
}

type Npc_say = {
    npcId : string,
    text : string,
    mood? : string
}

type Event = {
    kind: 'murder' | 'clue' | 'info',
    text: string
}

type Debug = {
    npcId : string,
    perception : string,
    memory : string[],
    thought : string
}

type Game_over = {
    won: boolean,
    killerId: string,
    timeline: string[],
    secrets: Record<string, unknown>
}

type Error = {
    code : number,
    message : string
}

export type { Session, State, Npc_say, Event, Debug, Game_over, Error }