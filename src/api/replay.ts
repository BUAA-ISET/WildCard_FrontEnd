import { apiGet, apiPost } from './request'
import { API_CONFIG, shouldUseGameMockApi } from './config'
import { buildRoomHeaders, roomApi } from './room'
import type { GameCard, GameSnapshot } from './game'
import { scopedStorageKey } from '../utils/storageNamespace'

export interface ReplayPlayer {
  id: string
  username: string
  avatar: string
}

export interface ReplayAction {
  playerId: string
  action: string
  cards: GameCard[]
  message: string
  turn: number
}

export interface ReplayFrame {
  index: number
  elapsedSeconds: number
  currentPlayerId: string
  hands: Record<string, GameCard[]>
  tableCards: GameCard[]
  action: ReplayAction | null
}

export interface MatchHistoryRecord {
  id: string
  sessionId: string
  roomCode: string
  ruleId: string
  ruleName: string
  startedAt: string
  endedAt: string
  result: 'win' | 'lose' | 'draw'
  players: ReplayPlayer[]
  winnerIds: string[]
}

export interface MatchReplay {
  record: MatchHistoryRecord
  frames: ReplayFrame[]
}

type ApiResult<T> = {
  success: boolean
  data?: T
  message?: string
}

type BackendReplayPlayer = Partial<ReplayPlayer>

type BackendReplayAction = Partial<ReplayAction> & {
  player_id?: string
}

type BackendReplayFrame = Partial<ReplayFrame> & {
  elapsed_seconds?: number
  current_player_id?: string
  table_cards?: GameCard[]
}

type BackendHistoryRecord = Partial<MatchHistoryRecord> & {
  session_id?: string
  room_code?: string
  rule_id?: string
  rule_name?: string
  started_at?: string
  ended_at?: string
  winner_ids?: string[]
  players?: BackendReplayPlayer[]
}

type BackendReplay = {
  record?: BackendHistoryRecord
  frames?: BackendReplayFrame[]
}

const REPLAY_STORAGE_KEY = scopedStorageKey('match-replays')

function hasBrowserStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createCard(id: string, point: number, suit: number): GameCard {
  const rankMap: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }
  const suitMap: Record<number, string> = { 0: 'S', 1: 'H', 2: 'C', 3: 'D' }

  return {
    id,
    properties: { point, suit },
    display: {
      rank: rankMap[point] || String(point),
      suit: suitMap[suit] || '?',
    },
  }
}

function buildSeedReplay(currentPlayerId: string): MatchReplay {
  const opponentId = 'seed-opponent'
  const now = Date.now()
  const players: ReplayPlayer[] = [
    { id: currentPlayerId, username: '你', avatar: '' },
    { id: opponentId, username: 'Player B', avatar: '' },
  ]
  const playerStart = [createCard('p-a', 1, 1), createCard('p-k', 13, 0), createCard('p-9', 9, 3)]
  const opponentStart = [createCard('o-q', 12, 2), createCard('o-8', 8, 1), createCard('o-6', 6, 0)]
  const firstPlay = [playerStart[0]]
  const secondPlay = [opponentStart[0]]

  return {
    record: {
      id: `mock-replay-${currentPlayerId}`,
      sessionId: 'mock-session-1',
      roomCode: 'DEMO01',
      ruleId: 'builtin-test-rule',
      ruleName: '测试规则',
      startedAt: new Date(now - 8 * 60 * 1000).toISOString(),
      endedAt: new Date(now - 2 * 60 * 1000).toISOString(),
      result: 'win',
      players,
      winnerIds: [currentPlayerId],
    },
    frames: [
      {
        index: 0,
        elapsedSeconds: 0,
        currentPlayerId,
        hands: {
          [currentPlayerId]: playerStart,
          [opponentId]: opponentStart,
        },
        tableCards: [],
        action: null,
      },
      {
        index: 1,
        elapsedSeconds: 22,
        currentPlayerId: opponentId,
        hands: {
          [currentPlayerId]: playerStart.slice(1),
          [opponentId]: opponentStart,
        },
        tableCards: firstPlay,
        action: {
          playerId: currentPlayerId,
          action: 'playCards',
          cards: firstPlay,
          message: '打出了 A H',
          turn: 1,
        },
      },
      {
        index: 2,
        elapsedSeconds: 48,
        currentPlayerId,
        hands: {
          [currentPlayerId]: playerStart.slice(1),
          [opponentId]: opponentStart.slice(1),
        },
        tableCards: secondPlay,
        action: {
          playerId: opponentId,
          action: 'playCards',
          cards: secondPlay,
          message: '打出了 Q C',
          turn: 2,
        },
      },
    ],
  }
}

function normalizePlayer(player: BackendReplayPlayer): ReplayPlayer {
  return {
    id: String(player.id || ''),
    username: player.username || 'Player',
    avatar: player.avatar || '',
  }
}

function normalizeAction(action: BackendReplayAction | null | undefined): ReplayAction | null {
  if (!action) {
    return null
  }

  return {
    playerId: String(action.playerId ?? action.player_id ?? ''),
    action: String(action.action || ''),
    cards: Array.isArray(action.cards) ? action.cards : [],
    message: String(action.message || ''),
    turn: Number(action.turn ?? 0),
  }
}

function normalizeFrame(frame: BackendReplayFrame, index: number): ReplayFrame {
  return {
    index: Number(frame.index ?? index),
    elapsedSeconds: Number(frame.elapsedSeconds ?? frame.elapsed_seconds ?? 0),
    currentPlayerId: String(frame.currentPlayerId ?? frame.current_player_id ?? ''),
    hands: frame.hands || {},
    tableCards: Array.isArray(frame.tableCards ?? frame.table_cards) ? (frame.tableCards ?? frame.table_cards ?? []) : [],
    action: normalizeAction(frame.action),
  }
}

function normalizeRecord(record: BackendHistoryRecord): MatchHistoryRecord {
  return {
    id: String(record.id || ''),
    sessionId: String(record.sessionId ?? record.session_id ?? ''),
    roomCode: String(record.roomCode ?? record.room_code ?? ''),
    ruleId: String(record.ruleId ?? record.rule_id ?? ''),
    ruleName: String(record.ruleName ?? record.rule_name ?? '未知规则'),
    startedAt: String(record.startedAt ?? record.started_at ?? ''),
    endedAt: String(record.endedAt ?? record.ended_at ?? ''),
    result: (record.result as MatchHistoryRecord['result']) || 'draw',
    players: Array.isArray(record.players) ? record.players.map(normalizePlayer) : [],
    winnerIds: record.winnerIds ?? record.winner_ids ?? [],
  }
}

function normalizeReplay(replay: BackendReplay): MatchReplay | null {
  if (!replay.record) {
    return null
  }

  return {
    record: normalizeRecord(replay.record),
    frames: Array.isArray(replay.frames) ? replay.frames.map(normalizeFrame) : [],
  }
}

function readMockReplays(): MatchReplay[] {
  if (!hasBrowserStorage()) {
    return [buildSeedReplay(roomApi.getCurrentPlayerId())]
  }

  const currentPlayerId = roomApi.getCurrentPlayerId()
  const saved = window.localStorage.getItem(REPLAY_STORAGE_KEY)
  if (!saved) {
    const seed = [buildSeedReplay(currentPlayerId)]
    window.localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(saved) as MatchReplay[]
    return parsed.length > 0 ? parsed : [buildSeedReplay(currentPlayerId)]
  } catch {
    const seed = [buildSeedReplay(currentPlayerId)]
    window.localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeMockReplays(replays: MatchReplay[]) {
  if (!hasBrowserStorage()) {
    return
  }

  window.localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(replays))
}

function shouldUseDevReplayFallback(result: ApiResult<unknown>) {
  return import.meta.env.DEV && !shouldUseGameMockApi() && !result.success
}

function replayFromFinishedSnapshot(snapshot: GameSnapshot): MatchReplay {
  const playerId = roomApi.getCurrentPlayerId()
  const now = new Date()
  const players = snapshot.players.map((player) => ({
    id: player.id,
    username: player.username,
    avatar: player.avatar,
  }))
  const visibleHands = Object.fromEntries(snapshot.players.map((player) => [
    player.id,
    player.id === playerId ? snapshot.handCards : [],
  ]))

  return {
    record: {
      id: `replay-${snapshot.sessionId || snapshot.roomCode}`,
      sessionId: snapshot.sessionId,
      roomCode: snapshot.roomCode,
      ruleId: snapshot.ruleId,
      ruleName: snapshot.ruleId,
      startedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      endedAt: now.toISOString(),
      result: snapshot.winnerIds.includes(playerId) ? 'win' : snapshot.winnerIds.length ? 'lose' : 'draw',
      players,
      winnerIds: snapshot.winnerIds,
    },
    frames: [
      {
        index: 0,
        elapsedSeconds: 0,
        currentPlayerId: snapshot.currentPlayerId,
        hands: visibleHands,
        tableCards: snapshot.table.playedCards,
        action: snapshot.lastAction,
      },
    ],
  }
}

export const replayApi = {
  async getHistory(): Promise<ApiResult<MatchHistoryRecord[]>> {
    const playerId = roomApi.getCurrentPlayerId()
    const result = await apiGet<ApiResult<BackendHistoryRecord[]>>(
      `${API_CONFIG.endpoints.replay.history}?playerId=${encodeURIComponent(playerId)}`,
      {
        useMock: shouldUseGameMockApi(),
        mockDelay: 200,
        mockFn: () => ({
          success: true,
          data: readMockReplays()
            .filter((replay) => replay.record.players.some((player) => player.id === playerId))
            .map((replay) => replay.record),
        }),
        headers: buildRoomHeaders(),
      },
    )

    if (shouldUseDevReplayFallback(result)) {
      return {
        success: true,
        data: readMockReplays()
          .filter((replay) => replay.record.players.some((player) => player.id === playerId))
          .map((replay) => replay.record),
      }
    }

    return {
      success: result.success,
      data: result.data?.map(normalizeRecord),
      message: result.message,
    }
  },

  async getReplay(replayId: string): Promise<ApiResult<MatchReplay>> {
    const result = await apiGet<ApiResult<BackendReplay>>(
      API_CONFIG.endpoints.replay.detail(replayId),
      {
        useMock: shouldUseGameMockApi(),
        mockDelay: 200,
        mockFn: () => {
          const replay = readMockReplays().find((item) => item.record.id === replayId)
          return replay
            ? { success: true, data: clone(replay) }
            : { success: false, message: 'Replay does not exist.' }
        },
        headers: buildRoomHeaders(),
      },
    )

    if (shouldUseDevReplayFallback(result)) {
      const replay = readMockReplays().find((item) => item.record.id === replayId)
      return replay
        ? { success: true, data: clone(replay) }
        : { success: false, message: 'Replay does not exist.' }
    }

    const replay = result.data ? normalizeReplay(result.data) : null
    return {
      success: result.success && Boolean(replay),
      data: replay || undefined,
      message: result.message,
    }
  },

  recordFinishedSnapshot(snapshot: GameSnapshot) {
    if (!shouldUseGameMockApi() || snapshot.status !== 'finished') {
      return
    }

    const replays = readMockReplays()
    const nextReplay = replayFromFinishedSnapshot(snapshot)
    const existingIndex = replays.findIndex((item) => item.record.id === nextReplay.record.id)
    if (existingIndex >= 0) {
      replays[existingIndex] = nextReplay
    } else {
      replays.unshift(nextReplay)
    }
    writeMockReplays(replays)
  },

  async saveReplayFromSnapshot(snapshot: GameSnapshot): Promise<ApiResult<MatchReplay>> {
    const result = await apiPost<ApiResult<BackendReplay>>(
      API_CONFIG.endpoints.replay.createFromSnapshot,
      snapshot,
      {
        useMock: shouldUseGameMockApi(),
        mockDelay: 200,
        mockFn: () => {
          const replay = replayFromFinishedSnapshot(snapshot)
          const replays = readMockReplays()
          writeMockReplays([replay, ...replays.filter((item) => item.record.id !== replay.record.id)])
          return { success: true, data: replay }
        },
        headers: buildRoomHeaders(),
      },
    )

    const replay = result.data ? normalizeReplay(result.data) : null
    return {
      success: result.success && Boolean(replay),
      data: replay || undefined,
      message: result.message,
    }
  },
}
