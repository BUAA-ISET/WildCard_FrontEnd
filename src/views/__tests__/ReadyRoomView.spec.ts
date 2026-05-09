import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { roomApi } from '../../api/room'
import { elementPlusStubs } from '../../test-utils/elementPlusStubs'
import ReadyRoomView from '../ReadyRoomView.vue'

const replace = vi.fn()
const push = vi.fn()

const createMockRoom = () => ({
  id: 'room-1',
  code: 'TEST123',
  hostId: 'player-1',
  playerCount: 4,
  roundTime: 60,
  ruleId: 'rule-1',
  ruleName: 'Classic Rules',
  password: null,
  status: 'waiting' as const,
  players: [
    { id: 'player-1', username: 'HostUser', avatar: '', isReady: true },
    { id: 'player-2', username: 'Player2', avatar: '', isReady: false },
  ],
})

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => ({ replace, push }),
    useRoute: () => ({ params: { roomCode: 'TEST123' }, path: '/game/TEST123' }),
  }
})

vi.mock('../../api/room', () => ({
  getRoomEntryPath: vi.fn((room: { code: string; status: string }) => (
    room.status === 'playing' ? `/game/${room.code}/battle` : `/game/${room.code}`
  )),
  roomApi: {
    getRoomByCode: vi.fn(),
    setReady: vi.fn(),
    startGame: vi.fn(),
    leaveRoom: vi.fn(),
    getCurrentPlayerId: vi.fn(() => 'player-1'),
  },
  DEFAULT_AVATAR: '/default-avatar.png',
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

vi.mock('../../stores/userStore', () => ({
  useUserStore: () => ({
    username: ref('TestUser'),
    avatar: ref(''),
  }),
}))

describe('ReadyRoomView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(roomApi.getRoomByCode).mockResolvedValue({
      success: true,
      data: createMockRoom(),
    })
    vi.mocked(roomApi.getCurrentPlayerId).mockReturnValue('player-1')
  })

  it('renders the room summary and leave action', async () => {
    const wrapper = mount(ReadyRoomView, {
      global: {
        stubs: elementPlusStubs,
      },
    })
    await flushPromises()

    expect(wrapper.find('.ready-room-page').exists()).toBe(true)
    expect(wrapper.text()).toContain('TEST123')
    expect(wrapper.find('.danger-btn').exists()).toBe(true)
  })

  it('lets a non-host toggle ready state', async () => {
    vi.mocked(roomApi.getCurrentPlayerId).mockReturnValue('player-2')
    vi.mocked(roomApi.setReady).mockResolvedValue({
      success: true,
      data: {
        ...createMockRoom(),
        players: [
          { id: 'player-1', username: 'HostUser', avatar: '', isReady: true },
          { id: 'player-2', username: 'Player2', avatar: '', isReady: true },
        ],
      },
    })

    const wrapper = mount(ReadyRoomView, {
      global: {
        stubs: elementPlusStubs,
      },
    })
    await flushPromises()

    await wrapper.find('.secondary-btn').trigger('click')
    await flushPromises()

    expect(roomApi.setReady).toHaveBeenCalledWith(true)
  })

  it('routes the room host into battle after a successful start', async () => {
    const playingRoom = {
      ...createMockRoom(),
      status: 'playing' as const,
      players: [
        { id: 'player-1', username: 'HostUser', avatar: '', isReady: true },
        { id: 'player-2', username: 'Player2', avatar: '', isReady: true },
        { id: 'player-3', username: 'Player3', avatar: '', isReady: true },
        { id: 'player-4', username: 'Player4', avatar: '', isReady: true },
      ],
    }

    vi.mocked(roomApi.getRoomByCode).mockResolvedValue({
      success: true,
      data: {
        ...playingRoom,
        status: 'waiting',
      },
    })
    vi.mocked(roomApi.startGame).mockResolvedValue({
      success: true,
      data: playingRoom,
    })

    const wrapper = mount(ReadyRoomView, {
      global: {
        stubs: elementPlusStubs,
      },
    })
    await flushPromises()

    await wrapper.find('.primary-btn').trigger('click')
    await flushPromises()

    expect(push).toHaveBeenCalledWith('/game/TEST123/battle')
  })

  it('leaves the room and returns home', async () => {
    vi.mocked(roomApi.leaveRoom).mockResolvedValue({ success: true })

    const wrapper = mount(ReadyRoomView, {
      global: {
        stubs: elementPlusStubs,
      },
    })
    await flushPromises()

    await wrapper.find('.danger-btn').trigger('click')
    await flushPromises()

    expect(roomApi.leaveRoom).toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith('/')
  })
})
