import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BattleView from '../BattleView.vue'

const replace = vi.fn()
const push = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => ({ replace, push }),
    useRoute: () => ({ params: { roomCode: 'TEST123' } }),
  }
})

vi.mock('../../api/room', () => ({
  roomApi: {
    getCurrentPlayerId: vi.fn(() => 'player-1'),
  },
}))

vi.mock('../../api/game', () => ({
  gameApi: {
    getCurrent: vi.fn(),
    playCards: vi.fn(),
    skip: vi.fn(),
  },
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

describe('BattleView', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    const { gameApi } = await import('../../api/game')
    vi.mocked(gameApi.getCurrent).mockResolvedValue({
      success: true,
      data: {
        sessionId: 'game-1',
        roomCode: 'TEST123',
        ruleId: 'classic',
        status: 'finished',
        currentPlayerId: 'player-1',
        roundTime: 60,
        deadlineAt: null,
        players: [
          {
            id: 'player-1',
            username: 'Player1',
            avatar: '',
            cardCount: 0,
            online: true,
            finished: true,
          },
          {
            id: 'player-2',
            username: 'Player2',
            avatar: '',
            cardCount: 3,
            online: true,
            finished: false,
          },
        ],
        table: {
          playedCards: [],
          passStreak: 0,
          lastPlayedBy: 'player-1',
        },
        handCards: [],
        pendingAction: null,
        lastAction: null,
        winnerIds: ['player-1'],
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a settlement reminder before redirecting back to the ready room', async () => {
    const wrapper = mount(BattleView)
    await flushPromises()

    expect(wrapper.text()).toContain('对局结束，你获胜了')
    expect(wrapper.text()).toContain('结算完成，正在返回准备房间...')
    expect(replace).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1800)
    await flushPromises()

    expect(replace).toHaveBeenCalledWith('/game/TEST123')
  })

  it('shows a defeat result when another player wins', async () => {
    const { gameApi } = await import('../../api/game')
    vi.mocked(gameApi.getCurrent).mockResolvedValueOnce({
      success: true,
      data: {
        sessionId: 'game-1',
        roomCode: 'TEST123',
        ruleId: 'classic',
        status: 'finished',
        currentPlayerId: 'player-2',
        roundTime: 60,
        deadlineAt: null,
        players: [
          {
            id: 'player-1',
            username: 'Player1',
            avatar: '',
            cardCount: 3,
            online: true,
            finished: false,
          },
          {
            id: 'player-2',
            username: 'Player2',
            avatar: '',
            cardCount: 0,
            online: true,
            finished: true,
          },
        ],
        table: {
          playedCards: [],
          passStreak: 0,
          lastPlayedBy: 'player-2',
        },
        handCards: [],
        pendingAction: null,
        lastAction: null,
        winnerIds: ['player-2'],
      },
    })

    const wrapper = mount(BattleView)
    await flushPromises()

    expect(wrapper.text()).toContain('对局结束，你失败了')
  })
})
