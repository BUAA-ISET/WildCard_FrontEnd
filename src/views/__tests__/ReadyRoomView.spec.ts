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
    useRoute: () => ({ params: { roomCode: 'TEST123' } }),
    onBeforeRouteLeave: vi.fn(() => () => true),
  }
})

vi.mock('../../api/room', () => ({
  roomApi: {
    getRoomByCode: vi.fn(),
    setReady: vi.fn(),
    startGame: vi.fn(),
    leaveRoom: vi.fn(),
    getCurrentPlayerId: vi.fn(() => 'player-1'),
  },
  DEFAULT_AVATAR: '/default-avatar.png',
  ROOM_STORAGE_KEY: 'room_storage_key',
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

  describe('页面渲染', () => {
    it('渲染房间准备页面', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      expect(wrapper.find('.ready-room-page').exists()).toBe(true)
    })

    it('显示房间号', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      expect(wrapper.find('.room-eyebrow').text()).toBe('Ready Room')
    })

    it('显示房间信息摘要', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      expect(wrapper.find('.room-summary').exists()).toBe(true)
      expect(wrapper.text()).toContain('TEST123')
      expect(wrapper.text()).toContain('Classic Rules')
      expect(wrapper.text()).toContain('2/4')
      expect(wrapper.text()).toContain('60s')
    })
  })

  describe('玩家网格', () => {
    it('显示玩家列表', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      expect(wrapper.findAll('.player-box').length).toBe(4)
    })

    it('显示空玩家槽位', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      expect(wrapper.findAll('.player-box.empty').length).toBe(2)
    })

    it('显示玩家用户名', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      expect(wrapper.text()).toContain('TestUser')
      expect(wrapper.text()).toContain('Player2')
    })

    it('显示房主标签', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      expect(wrapper.text()).toContain('房主')
    })

    it('显示玩家准备状态', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      expect(wrapper.text()).toContain('准备')
      expect(wrapper.text()).toContain('未准备')
    })
  })

  describe('操作按钮', () => {
    it('房主显示开始游戏按钮', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      const startButton = wrapper.find('.primary-btn')
      expect(startButton.exists()).toBe(true)
      expect(startButton.text()).toBe('开始游戏')
    })

    it('非房主显示准备/取消准备按钮', async () => {
      vi.mocked(roomApi.getCurrentPlayerId).mockReturnValue('player-2')
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      const readyButton = wrapper.find('.secondary-btn')
      expect(readyButton.exists()).toBe(true)
      expect(readyButton.text()).toBe('准备')
    })

    it('显示离开房间按钮', async () => {
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      const leaveButton = wrapper.find('.danger-btn')
      expect(leaveButton.exists()).toBe(true)
      expect(leaveButton.text()).toBe('离开房间')
    })
  })

  describe('离开房间功能', () => {
    it('点击离开房间按钮调用leaveRoom', async () => {
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
    })
  })

  describe('游戏开始条件', () => {
    it('所有玩家准备时房主可以开始游戏', async () => {
      const fullRoom = {
        ...createMockRoom(),
        players: [
          { id: 'player-1', username: 'HostUser', avatar: '', isReady: true },
          { id: 'player-2', username: 'Player2', avatar: '', isReady: true },
          { id: 'player-3', username: 'Player3', avatar: '', isReady: true },
          { id: 'player-4', username: 'Player4', avatar: '', isReady: true },
        ],
      }
      vi.mocked(roomApi.getRoomByCode).mockResolvedValue({
        success: true,
        data: fullRoom,
      })
      const wrapper = mount(ReadyRoomView, {
        global: {
          stubs: elementPlusStubs,
        },
      })
      await flushPromises()
      const startButton = wrapper.find('.primary-btn')
      expect(startButton.exists()).toBe(true)
    })
  })
})
