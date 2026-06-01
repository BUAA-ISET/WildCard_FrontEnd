import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MatchHistoryView from '../MatchHistoryView.vue'
import { replayApi } from '../../api/replay'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('../../api/replay', () => ({
  replayApi: {
    getHistory: vi.fn(),
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

describe('MatchHistoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(replayApi.getHistory).mockResolvedValue({
      success: true,
      data: [
        {
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
      ],
    })
  })

  it('renders match records and opens the replay page', async () => {
    const wrapper = mount(MatchHistoryView)
    await flushPromises()

    expect(wrapper.text()).toContain('测试规则')
    expect(wrapper.text()).toContain('Alice、Bob')

    await wrapper.find('.replay-btn').trigger('click')

    expect(push).toHaveBeenCalledWith('/match-history/replay-1')
  })
})
