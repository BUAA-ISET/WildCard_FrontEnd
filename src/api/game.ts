import { apiGet, apiPost } from './request'
import { API_CONFIG, shouldUseGameMockApi } from './config'
import { buildRoomHeaders, roomApi } from './room'

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

type BackendApiResult<T> = {
    success: boolean
    data?: T
    message?: string
}

type BackendRoomPlayer = {
    id?: string
    username?: string
    avatar?: string
}

type BackendRoom = {
    ruleId?: string
    ruleName?: string
    roundTime?: number
    playerCount?: number
    players?: BackendRoomPlayer[]
}

type BackendGameCard = {
    id?: string
    properties?: Record<string, number>
}

type BackendPendingAction = {
    id?: string
    player_id?: string
    component_type?: number
    timer?: number
}

type BackendGamePlayer = {
    id?: string
    properties?: Record<string, number>
}

type BackendGameSession = {
    id?: string
    room_code?: string
    status?: string
    players?: BackendGamePlayer[]
    table?: Record<string, number>
    hands?: Record<string, BackendGameCard[]>
    pending_action?: BackendPendingAction | null
    settlement_results?: Record<string, number>
    last_successful_play?: {
        player_id?: string
        cards?: BackendGameCard[]
    } | null
    last_action_player_id?: string | null
    last_action_cards?: BackendGameCard[]
    last_action_skipped?: boolean
}

const DEFAULT_RULE_ID = 'builtin-test-rule'
const DEFAULT_ROUND_TIME = 30

const SUIT_DISPLAY: Record<number, string> = {
    0: 'S',
    1: 'H',
    2: 'C',
    3: 'D',
}

const RANK_DISPLAY: Record<number, string> = {
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K',
}

function getPointValue(card: BackendGameCard): number {
    return Number(card.properties?.point ?? card.properties?.['点数'] ?? 0)
}

function getSuitValue(card: BackendGameCard): number {
    return Number(card.properties?.suit ?? card.properties?.['花色'] ?? 0)
}

function getRankDisplay(point: number): string {
    if (point <= 0) {
        return '?'
    }

    return RANK_DISPLAY[point] || String(point)
}

function getPlayerHandCount(player: BackendGamePlayer, hands: Record<string, BackendGameCard[]>): number {
    const playerId = String(player.id || '')
    const directCount = hands[playerId]?.length
    if (typeof directCount === 'number') {
        return directCount
    }

    return Number(player.properties?.hand_count ?? player.properties?.handCount ?? 0)
}

function normalizeCard(card: BackendGameCard): GameCard {
    const point = getPointValue(card)
    const suit = getSuitValue(card)

    return {
        id: String(card.id || ''),
        properties: {
            point,
            suit,
        },
        display: {
            rank: getRankDisplay(point),
            suit: SUIT_DISPLAY[suit] || '?',
        },
    }
}

function buildLastAction(session: BackendGameSession): GameActionRecord | null {
    const cards = Array.isArray(session.last_action_cards)
        ? session.last_action_cards.map(normalizeCard)
        : []
    const playerId = session.last_action_player_id || session.last_successful_play?.player_id || ''

    if (!playerId) {
        return null
    }

    const skipped = Boolean(session.last_action_skipped)
    return {
        playerId,
        action: skipped ? 'skip' : 'playCards',
        cards,
        message: skipped ? 'Opponent skipped' : `Played ${cards.length} card(s)`,
        turn: 0,
    }
}

async function loadRoomMeta(roomCode: string): Promise<BackendRoom | null> {
    const result = await roomApi.getRoomByCode(roomCode)
    if (!result.success || !result.data) {
        return null
    }

    return result.data
}

function resolveCurrentPlayerId(session: BackendGameSession, players: BackendGamePlayer[]): string {
    const pendingPlayerId = String(session.pending_action?.player_id || '')
    if (pendingPlayerId) {
        return pendingPlayerId
    }

    const playerIndex = Number(session.table?.player_index ?? 0)
    if (players.length === 0) {
        return ''
    }

    const normalizedIndex = Math.min(Math.max(playerIndex, 0), players.length - 1)
    return String(players[normalizedIndex]?.id || '')
}

function toSnapshot(session: BackendGameSession, room: BackendRoom | null): GameSnapshot {
    const roomCode = String(session.room_code || '')
    const hands = session.hands || {}
    const players = Array.isArray(session.players) ? session.players : []
    const currentPlayerId = resolveCurrentPlayerId(session, players)
    const selfPlayerId = roomApi.getCurrentPlayerId()
    const selfHand = Array.isArray(hands[selfPlayerId]) ? hands[selfPlayerId].map(normalizeCard) : []
    const playedCards = (session.last_successful_play?.cards || []).map(normalizeCard)
    const lastPlayedBy = session.last_successful_play?.player_id || null
    const pending = session.pending_action
    const settlement = session.settlement_results || {}
    const winnerIds = Object.entries(settlement)
        .filter(([, result]) => Number(result) > 0)
        .map(([playerId]) => playerId)
    const roundTime = Number(room?.roundTime ?? DEFAULT_ROUND_TIME)
    const status = session.status === 'finished' ? 'finished' : 'playing'

    return {
        sessionId: String(session.id || ''),
        roomCode,
        ruleId: String(room?.ruleId || DEFAULT_RULE_ID),
        status,
        currentPlayerId,
        roundTime,
        deadlineAt: pending?.timer ? Date.now() + Number(pending.timer) * 1000 : null,
        players: players.map((player) => {
            const playerId = String(player.id || '')
            const roomPlayer = room?.players?.find((item) => item.id === playerId)

            return {
                id: playerId,
                username: roomPlayer?.username || `Player ${playerId.slice(0, 6)}`,
                avatar: roomPlayer?.avatar || '',
                cardCount: getPlayerHandCount(player, hands),
                online: true,
                finished: winnerIds.includes(playerId),
            }
        }),
        table: {
            playedCards,
            passStreak: session.last_action_skipped ? 1 : 0,
            lastPlayedBy,
        },
        handCards: selfHand,
        pendingAction: pending ? {
            actionId: String(pending.id || ''),
            playerId: String(pending.player_id || ''),
            actionType: 'playCards',
            canSkip: playedCards.length > 0,
        } : null,
        lastAction: buildLastAction(session),
        winnerIds,
    }
}

async function normalizeGameResult(
    result: BackendApiResult<BackendGameSession>,
    roomCodeHint?: string,
): Promise<ApiResult<GameSnapshot>> {
    if (!result.success || !result.data) {
        return {
            success: result.success,
            message: result.message,
        }
    }

    const roomCode = roomCodeHint || String(result.data.room_code || '')
    const room = roomCode ? await loadRoomMeta(roomCode) : null

    return {
        success: true,
        data: toSnapshot(result.data, room),
    }
}

export const gameApi = {
    async getCurrent(roomCode: string): Promise<ApiResult<GameSnapshot>> {
        const result = await apiGet<BackendApiResult<BackendGameSession>>(
            `${API_CONFIG.endpoints.game.getCurrent}?roomCode=${encodeURIComponent(roomCode)}`,
            {
                useMock: shouldUseGameMockApi(),
                headers: buildRoomHeaders(),
            },
        )

        return normalizeGameResult(result, roomCode)
    },

    async playCards(sessionId: string, actionId: string, cardIds: string[]): Promise<ApiResult<GameSnapshot>> {
        const result = await apiPost<BackendApiResult<BackendGameSession>>(
            `/api/games/${encodeURIComponent(sessionId)}/actions/${encodeURIComponent(actionId)}/play-cards`,
            {
                cardIds,
            },
            {
                useMock: shouldUseGameMockApi(),
                headers: buildRoomHeaders(),
            },
        )

        return normalizeGameResult(result)
    },

    async skip(sessionId: string, actionId: string): Promise<ApiResult<GameSnapshot>> {
        const result = await apiPost<BackendApiResult<BackendGameSession>>(
            `/api/games/${encodeURIComponent(sessionId)}/actions/${encodeURIComponent(actionId)}/skip`,
            {},
            {
                useMock: shouldUseGameMockApi(),
                headers: buildRoomHeaders(),
            },
        )

        return normalizeGameResult(result)
    },
}
