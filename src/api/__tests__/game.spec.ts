import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { USER_STORAGE_KEY } from '../../utils/storageNamespace'
import { gameApi } from '../game'
import { roomApi } from '../room'

const originalFetch = globalThis.fetch

const backendSession = {
  sessionId: 'game-001',
  roomCode: 'ROOM01',
  ruleId: 'rule-001',
  status: 'playing',
  currentPlayerId: 'user-001',
  roundTime: 45,
  players: [
    { id: 'user-001', username: 'alice', avatar: '', cardCount: 2, online: true, finished: false },
    { id: 'user-002', username: 'bob', avatar: '', cardCount: 3, online: true, finished: false },
  ],
  table: {
    playedCards: [],
    passStreak: 0,
    lastPlayedBy: null,
  },
  handCards: [
    { id: 'card-001', properties: { point: 14, suit: 0 }, display: { rank: 'A', suit: '♠' } },
  ],
  pendingAction: {
    actionId: 'action-1',
    playerId: 'user-001',
    actionType: 'playCards',
    canSkip: false,
  },
  lastAction: null,
  winnerIds: [],
}

describe('gameApi', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      id: 'user-001',
      username: 'alice',
      email: 'alice@example.com',
      avatar: '/alice.png',
    }))
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('loads the current game with an encoded room code and player headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: backendSession })),
    )
    globalThis.fetch = fetchMock

    const result = await gameApi.getCurrent('ROOM 01')

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      sessionId: 'game-001',
      roomCode: 'ROOM01',
      currentPlayerId: 'user-001',
      handCards: [{ id: 'card-001' }],
      pendingAction: { actionId: 'action-1', playerId: 'user-001' },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/games/current?roomCode=ROOM%2001'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-player-id': 'user-001',
          'x-player-name': encodeURIComponent('alice'),
          'x-player-avatar': encodeURIComponent('/alice.png'),
        }),
      }),
    )
  })

  it('submits selected card ids to the play-cards endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: backendSession })),
    )
    globalThis.fetch = fetchMock

    await gameApi.playCards('game 001', 'action 1', ['card-001'])

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/games/game%20001/actions/action%201/play-cards'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ cardIds: ['card-001'] }),
      }),
    )
  })

  it('submits skip actions with an empty body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: backendSession })),
    )
    globalThis.fetch = fetchMock

    await gameApi.skip('game 001', 'action 1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/games/game%20001/actions/action%201/skip'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({}),
      }),
    )
  })

  it('normalizes engine-style game sessions with room metadata', async () => {
    const engineSession = {
      id: 'engine-session-1',
      room_code: 'ROOM01',
      status: 'playing',
      players: [
        { id: 'user-001', properties: { hand_count: 1 } },
        { id: 'user-002', properties: { hand_count: 2 } },
      ],
      table: { player_index: 1 },
      hands: {
        'user-001': [{ id: 'card-a', properties: { point: 1, suit: 0 } }],
        'user-002': [
          { id: 'card-k', properties: { point: 13, suit: 1 } },
          { id: 'card-q', properties: { point: 12, suit: 2 } },
        ],
      },
      pending_action: {
        id: 'action-engine-1',
        player_id: 'user-002',
        component_type: 21,
        timer: 30,
      },
      last_successful_play: {
        player_id: 'user-001',
        cards: [{ id: 'card-prev', properties: { point: 13, suit: 1 } }],
      },
      settlement_results: { 'user-002': 1 },
      last_action_player_id: 'user-001',
      last_action_cards: [{ id: 'card-prev', properties: { point: 13, suit: 1 } }],
      last_action_skipped: false,
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: engineSession })),
    )
    globalThis.fetch = fetchMock
    vi.spyOn(roomApi, 'getRoomByCode').mockResolvedValue({
      success: true,
      data: {
        id: 'room-1',
        code: 'ROOM01',
        hostId: 'user-001',
        playerCount: 2,
        roundTime: 60,
        ruleId: 'rule-engine',
        ruleName: 'Engine Rule',
        password: null,
        players: [
          { id: 'user-001', username: 'alice', avatar: '/alice.png', isReady: true },
          { id: 'user-002', username: 'bob', avatar: '/bob.png', isReady: true },
        ],
        status: 'playing',
      },
    })

    const result = await gameApi.getCurrent('ROOM 01')

    expect(roomApi.getRoomByCode).toHaveBeenCalledWith('ROOM 01')
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      sessionId: 'engine-session-1',
      roomCode: 'ROOM01',
      ruleId: 'rule-engine',
      currentPlayerId: 'user-002',
      roundTime: 60,
      players: [
        { id: 'user-001', username: 'alice', cardCount: 1 },
        { id: 'user-002', username: 'bob', cardCount: 2, finished: true },
      ],
      handCards: [{ id: 'card-a', display: { rank: 'A', suit: 'S' } }],
      table: {
        playedCards: [{ id: 'card-prev', display: { rank: 'K', suit: 'H' } }],
        lastPlayedBy: 'user-001',
      },
      pendingAction: {
        actionId: 'action-engine-1',
        playerId: 'user-002',
        actionType: 'playCards',
        canSkip: true,
      },
      lastAction: {
        playerId: 'user-001',
        action: 'playCards',
        cards: [{ id: 'card-prev', display: { rank: 'K', suit: 'H' } }],
      },
      winnerIds: ['user-002'],
    })
  })
})
