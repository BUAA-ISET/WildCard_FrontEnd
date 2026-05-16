import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { USER_STORAGE_KEY } from '../../utils/storageNamespace'
import { gameApi } from '../game'

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
})
