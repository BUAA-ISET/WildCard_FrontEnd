import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReplayView from '../ReplayView.vue'
import { replayApi } from '../../api/replay'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { replayId: 'replay-1' } }),
  useRouter: () => ({ push }),
}))

vi.mock('../../api/replay', () => ({
  replayApi: {
    getReplay: vi.fn(),
  },
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
    },
  }
})

describe('ReplayView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(replayApi.getReplay).mockResolvedValue({
      success: true,
      data: {
        record: {
          id: 'replay-1',
          sessionId: 'session-1',
          roomCode: 'ROOM01',
          ruleId: 'builtin-test-rule',
          ruleName: '测试规则',
          startedAt: '2026-05-29T12:00:00Z',
          endedAt: '2026-05-29T12:10:00Z',
          result: 'win',
          players: [
            { id: 'player-1', username: 'Alice', avatar: '' },
            { id: 'player-2', username: 'Bob', avatar: '' },
          ],
          winnerIds: ['player-1'],
        },
        frames: [
          {
            index: 0,
            elapsedSeconds: 0,
            currentPlayerId: 'player-1',
            hands: {
              'player-1': [
                {
                  id: 'card-1',
                  properties: { point: 1, suit: 1 },
                  display: { rank: 'A', suit: 'H' },
                },
              ],
              'player-2': [],
            },
            tableCards: [],
            action: null,
          },
          {
            index: 1,
            elapsedSeconds: 12,
            currentPlayerId: 'player-2',
            hands: {
              'player-1': [],
              'player-2': [],
            },
            tableCards: [
              {
                id: 'card-1',
                properties: { point: 1, suit: 1 },
                display: { rank: 'A', suit: 'H' },
              },
            ],
            action: {
              playerId: 'player-1',
              action: 'playCards',
              cards: [],
              message: 'Alice 打出了 A H',
              turn: 1,
            },
          },
        ],
      },
    })
  })

  it('shows replay frames and steps through the timeline', async () => {
    const wrapper = mount(ReplayView)
    await flushPromises()

    expect(wrapper.text()).toContain('测试规则')
    expect(wrapper.text()).toContain('对局开始，等待第一步操作')

    await wrapper.findAll('.step-btn')[1].trigger('click')

    expect(wrapper.text()).toContain('Alice 打出了 A H')
  })
})
