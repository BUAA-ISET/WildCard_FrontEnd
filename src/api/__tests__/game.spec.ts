import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../request'
import { gameApi } from '../game'
import { roomApi } from '../room'

vi.mock('../request', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('../config', () => ({
  API_CONFIG: {
    endpoints: {
      game: { getCurrent: '/api/games/current' },
    },
  },
  shouldUseGameMockApi: () => false,
}))

vi.mock('../room', () => ({
  buildRoomHeaders: () => ({ 'X-Room-Code': 'ROOM42' }),
  roomApi: {
    getRoomByCode: vi.fn(),
    getCurrentPlayerId: vi.fn(),
  },
}))

describe('gameApi assets normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(roomApi.getCurrentPlayerId).mockReturnValue('player-1')
    vi.mocked(roomApi.getRoomByCode).mockResolvedValue({
      success: true,
      data: {
        id: 'room-id-42',
        code: 'ROOM42',
        hostId: 'player-1',
        playerCount: 2,
        ruleId: 'rule-asset-demo',
        ruleName: 'Asset Demo',
        roundTime: 45,
        password: null,
        status: 'playing',
        players: [
          { id: 'player-1', username: 'Alice', avatar: '/alice.png', isReady: true },
          { id: 'player-2', username: 'Bob', avatar: '/bob.png', isReady: true },
        ],
      },
    })
  })

  it('keeps backend rule_assets on normalized current-game snapshots', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      success: true,
      data: {
        id: 'session-1',
        room_code: 'ROOM42',
        status: 'playing',
        table: { player_index: 0 },
        players: [{ id: 'player-1' }, { id: 'player-2' }],
        hands: {
          'player-1': [{ id: 'c-1', properties: { 点数: 1, 花色: 0 } }],
        },
        pending_action: { id: 'action-1', player_id: 'player-1', timer: 30 },
        rule_assets: {
          card_faces: {
            '%E7%82%B9%E6%95%B0=1&%E8%8A%B1%E8%89%B2=0': {
              properties: { 点数: 1, 花色: 0 },
              image_url: '/static/rule-assets/ace-spade.png',
            },
          },
          card_back: '/static/rule-assets/back.png',
          background: '/static/rule-assets/table.png',
        },
      },
    })

    const result = await gameApi.getCurrent('ROOM42')

    expect(apiGet).toHaveBeenCalledWith(
      '/api/games/current?roomCode=ROOM42',
      expect.objectContaining({ useMock: false, headers: { 'X-Room-Code': 'ROOM42' } }),
    )
    expect(result.success).toBe(true)
    expect(result.data?.assets).toEqual({
      card_faces: {
        '%E7%82%B9%E6%95%B0=1&%E8%8A%B1%E8%89%B2=0': {
          properties: { 点数: 1, 花色: 0 },
          image_url: '/static/rule-assets/ace-spade.png',
        },
      },
      card_back: '/static/rule-assets/back.png',
      background: '/static/rule-assets/table.png',
    })
  })

  it('preserves already-normalized assets returned after play-card actions', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      success: true,
      data: {
        sessionId: 'session-1',
        roomCode: 'ROOM42',
        ruleId: 'rule-asset-demo',
        status: 'playing',
        currentPlayerId: 'player-1',
        roundTime: 45,
        deadlineAt: null,
        players: [],
        table: { playedCards: [] },
        handCards: [],
        pendingAction: null,
        lastAction: null,
        winnerIds: [],
        assets: {
          card_back: '/static/rule-assets/back.png',
          background: '/static/rule-assets/table.png',
        },
      },
    })

    const result = await gameApi.playCards('session-1', 'action-1', ['c-1'])

    expect(apiPost).toHaveBeenCalledWith(
      '/api/games/session-1/actions/action-1/play-cards',
      { cardIds: ['c-1'] },
      expect.objectContaining({ useMock: false, headers: { 'X-Room-Code': 'ROOM42' } }),
    )
    expect(result.data?.assets?.background).toBe('/static/rule-assets/table.png')
  })
})
