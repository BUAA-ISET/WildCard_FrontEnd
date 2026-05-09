import { apiGet, apiPost } from './request'
import { API_CONFIG, shouldUseGameMockApi } from './config'
import { buildRoomHeaders } from './room'

export interface GameCard {
    id: string
    properties: {
        point: number
        suit: number
    }
    display: {
        rank: string
        suit: string
    }
}

export interface GamePlayerView {
    id: string
    username: string
    avatar: string
    cardCount: number
    online: boolean
    finished: boolean
}

export interface GameTableView {
    playedCards: GameCard[]
    passStreak: number
    lastPlayedBy: string | null
}

export interface PendingAction {
    actionId: string
    playerId: string
    actionType: 'playCards'
    canSkip: boolean
}

export interface GameActionRecord {
    playerId: string
    action: string
    cards: GameCard[]
    message: string
    turn: number
}

export interface GameSnapshot {
    sessionId: string
    roomCode: string
    ruleId: string
    status: 'playing' | 'settling' | 'finished'
    currentPlayerId: string
    roundTime: number
    deadlineAt: number | null
    players: GamePlayerView[]
    table: GameTableView
    handCards: GameCard[]
    pendingAction: PendingAction | null
    lastAction: GameActionRecord | null
    winnerIds: string[]
}

type ApiResult<T> = {
    success: boolean
    data?: T
    message?: string
}

export const gameApi = {
    async getCurrent(roomCode: string): Promise<ApiResult<GameSnapshot>> {
        return apiGet(`${API_CONFIG.endpoints.game.getCurrent}?roomCode=${encodeURIComponent(roomCode)}`, {
            useMock: shouldUseGameMockApi(),
            headers: buildRoomHeaders(),
        })
    },

    async playCards(sessionId: string, actionId: string, cardIds: string[]): Promise<ApiResult<GameSnapshot>> {
        return apiPost(`/api/games/${encodeURIComponent(sessionId)}/actions/${encodeURIComponent(actionId)}/play-cards`, {
            cardIds,
        }, {
            useMock: shouldUseGameMockApi(),
            headers: buildRoomHeaders(),
        })
    },

    async skip(sessionId: string, actionId: string): Promise<ApiResult<GameSnapshot>> {
        return apiPost(`/api/games/${encodeURIComponent(sessionId)}/actions/${encodeURIComponent(actionId)}/skip`, {}, {
            useMock: shouldUseGameMockApi(),
            headers: buildRoomHeaders(),
        })
    },
}
