import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { replayApi } from '../replay'
import { API_CONFIG } from '../config'
import type { GameSnapshot } from '../game'
import { USER_STORAGE_KEY, scopedStorageKey } from '../../utils/storageNamespace'

const originalFetch = globalThis.fetch
const originalGameUseMock = API_CONFIG.gameUseMock

function cacheSignedInUser(id = 'user 001') {
  window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
    id,
    username: 'Alice User',
    email: 'alice@example.com',
    avatar: '/alice.png',
  }))
}

function snapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    sessionId: 'session-1',
    roomCode: 'ROOM01',
    ruleId: 'rule-1',
    status: 'finished',
    currentPlayerId: 'user 001',
    roundTime: 30,
    deadlineAt: null,
    players: [
      { id: 'user 001', username: 'Alice User', avatar: '/alice.png', cardCount: 1, online: true, finished: true },
      { id: 'user-002', username: 'Bob', avatar: '/bob.png', cardCount: 0, online: true, finished: true },
    ],
    table: {
      playedCards: [
        { id: 'table-card', properties: { point: 13, suit: 0 }, display: { rank: 'K', suit: 'S' } },
      ],
    },
    handCards: [
      { id: 'hand-card', properties: { point: 1, suit: 1 }, display: { rank: 'A', suit: 'H' } },
    ],
    pendingAction: null,
    lastAction: null,
    winnerIds: ['user 001'],
    ...overrides,
  }
}

describe('replayApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
    window.sessionStorage.clear()
    API_CONFIG.gameUseMock = false
    cacheSignedInUser()
  })

  afterEach(() => {
    API_CONFIG.gameUseMock = originalGameUseMock
    globalThis.fetch = originalFetch
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads history with the current player query and normalizes backend snake case fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: [
        {
          id: 'replay-1',
          session_id: 'session-1',
          room_code: 'ROOM01',
          rule_id: 'rule-1',
          rule_name: 'Replay Rule',
          started_at: '2026-06-01T03:00:00Z',
          ended_at: '2026-06-01T03:05:00Z',
          result: 'win',
          players: [
            { id: 'user 001', username: 'Alice User' },
            { id: 'user-002', username: 'Bob', avatar: '/bob.png' },
          ],
          winner_ids: ['user 001'],
        },
      ],
    })))
    globalThis.fetch = fetchMock

    const result = await replayApi.getHistory()

    expect(result).toEqual({
      success: true,
      data: [
        {
          id: 'replay-1',
          sessionId: 'session-1',
          roomCode: 'ROOM01',
          ruleId: 'rule-1',
          ruleName: 'Replay Rule',
          startedAt: '2026-06-01T03:00:00Z',
          endedAt: '2026-06-01T03:05:00Z',
          result: 'win',
          players: [
            { id: 'user 001', username: 'Alice User', avatar: '' },
            { id: 'user-002', username: 'Bob', avatar: '/bob.png' },
          ],
          winnerIds: ['user 001'],
        },
      ],
      message: undefined,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/replays/history?playerId=user%20001'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-player-id': 'user 001',
          'x-player-name': encodeURIComponent('Alice User'),
          'x-player-avatar': encodeURIComponent('/alice.png'),
        }),
      }),
    )
  })

  it('loads replay details with an encoded id and normalizes frame and action contracts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        record: {
          id: 'replay/id 1',
          session_id: 'session-1',
          room_code: 'ROOM01',
          rule_id: 'rule-1',
          rule_name: 'Replay Rule',
          started_at: '2026-06-01T03:00:00Z',
          ended_at: '2026-06-01T03:05:00Z',
          result: 'lose',
          players: [{ id: 'user 001', username: 'Alice User', avatar: '/alice.png' }],
          winner_ids: ['user-002'],
        },
        frames: [
          {
            elapsed_seconds: 15,
            current_player_id: 'user-002',
            hands: {
              'user 001': [{ id: 'card-a', properties: { point: 1, suit: 1 }, display: { rank: 'A', suit: 'H' } }],
            },
            table_cards: [{ id: 'card-k', properties: { point: 13, suit: 0 }, display: { rank: 'K', suit: 'S' } }],
            action: {
              player_id: 'user 001',
              action: 'playCards',
              cards: [{ id: 'card-k', properties: { point: 13, suit: 0 }, display: { rank: 'K', suit: 'S' } }],
              message: '打出了 1 张牌',
              turn: 2,
            },
          },
        ],
      },
    })))
    globalThis.fetch = fetchMock

    const result = await replayApi.getReplay('replay/id 1')

    expect(result.success).toBe(true)
    expect(result.data?.frames).toEqual([
      {
        index: 0,
        elapsedSeconds: 15,
        currentPlayerId: 'user-002',
        hands: {
          'user 001': [{ id: 'card-a', properties: { point: 1, suit: 1 }, display: { rank: 'A', suit: 'H' } }],
        },
        tableCards: [{ id: 'card-k', properties: { point: 13, suit: 0 }, display: { rank: 'K', suit: 'S' } }],
        action: {
          playerId: 'user 001',
          action: 'playCards',
          cards: [{ id: 'card-k', properties: { point: 13, suit: 0 }, display: { rank: 'K', suit: 'S' } }],
          message: '打出了 1 张牌',
          turn: 2,
        },
      },
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/replays/replay%2Fid%201'),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('stores finished mock snapshots as replay records for the current player', () => {
    API_CONFIG.gameUseMock = true

    replayApi.recordFinishedSnapshot(snapshot())

    const stored = JSON.parse(window.localStorage.getItem(scopedStorageKey('match-replays')) || '[]')
    expect(stored[0]).toMatchObject({
      record: {
        id: 'replay-session-1',
        sessionId: 'session-1',
        roomCode: 'ROOM01',
        ruleId: 'rule-1',
        result: 'win',
        winnerIds: ['user 001'],
      },
      frames: [
        {
          index: 0,
          currentPlayerId: 'user 001',
          hands: {
            'user 001': [{ id: 'hand-card', properties: { point: 1, suit: 1 }, display: { rank: 'A', suit: 'H' } }],
            'user-002': [],
          },
          tableCards: [{ id: 'table-card', properties: { point: 13, suit: 0 }, display: { rank: 'K', suit: 'S' } }],
        },
      ],
    })
  })
})
