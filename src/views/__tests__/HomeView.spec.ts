import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomeView from '../HomeView.vue'
import { roomApi } from '../../api/room'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('../../api/room', () => ({
  getRoomEntryPath: vi.fn((room: { code: string; status: string }) => (
    room.status === 'playing' ? `/game/${room.code}/battle` : `/game/${room.code}`
  )),
  roomApi: {
    getCurrentRoom: vi.fn(),
  },
}))

const elButtonStub = {
  template: '<button @click="$emit(\'click\')"><slot /></button>',
}

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(roomApi.getCurrentRoom).mockResolvedValue({
      success: true,
      data: null,
    })
  })

  it('renders the landing content', () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          'el-button': elButtonStub,
        },
      },
    })

    expect(wrapper.find('.main-logo').exists()).toBe(true)
    expect(wrapper.text()).toContain('Make your own rule!')
    expect(wrapper.text()).toContain('Unleash your imagination')
  })

  it('shows a continue room action when the player is still in a room', async () => {
    vi.mocked(roomApi.getCurrentRoom).mockResolvedValue({
      success: true,
      data: {
        id: 'room-1',
        code: 'ROOM88',
        hostId: 'host',
        playerCount: 4,
        roundTime: 30,
        ruleId: 'classic',
        ruleName: 'Classic Rules',
        password: null,
        players: [],
        status: 'waiting',
      },
    })

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          'el-button': elButtonStub,
        },
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('CONTINUE ROOM')
  })

  it('navigates back into the active room from the continue action', async () => {
    vi.mocked(roomApi.getCurrentRoom).mockResolvedValue({
      success: true,
      data: {
        id: 'room-1',
        code: 'ROOM99',
        hostId: 'host',
        playerCount: 4,
        roundTime: 30,
        ruleId: 'classic',
        ruleName: 'Classic Rules',
        password: null,
        players: [],
        status: 'playing',
      },
    })

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          'el-button': elButtonStub,
        },
      },
    })
    await flushPromises()

    await wrapper.find('button').trigger('click')

    expect(push).toHaveBeenCalledWith('/game/ROOM99/battle')
  })
})
