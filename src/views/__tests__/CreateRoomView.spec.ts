import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { roomApi } from '../../api/room'
import { elementPlusStubs } from '../../test-utils/elementPlusStubs'
import CreateRoomView from '../CreateRoomView.vue'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('../../api/room', () => ({
  getRoomEntryPath: vi.fn((room: { code: string; status: string }) => (
    room.status === 'playing' ? `/game/${room.code}/battle` : `/game/${room.code}`
  )),
  roomApi: {
    getRuleOptions: vi.fn(),
    createRoom: vi.fn(),
  },
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

describe('CreateRoomView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('loads rule options and creates a room with the selected defaults', async () => {
    vi.mocked(roomApi.getRuleOptions).mockResolvedValue({
      success: true,
      data: [{ id: 'classic', name: 'Classic Rules', playerCount: 4 }],
    })
    vi.mocked(roomApi.createRoom).mockResolvedValue({
      success: true,
      data: {
        id: 'room-1',
        code: 'ROOM42',
        hostId: 'currentUser',
        playerCount: 4,
        roundTime: 30,
        ruleId: 'classic',
        ruleName: 'Classic Rules',
        password: null,
        players: [],
        status: 'waiting',
      },
    })

    const wrapper = mount(CreateRoomView, {
      global: { stubs: elementPlusStubs },
    })
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(roomApi.createRoom).toHaveBeenCalledWith({
      ruleId: 'classic',
      roundTime: 30,
      password: undefined,
    })
    expect(push).toHaveBeenCalledWith('/game/ROOM42')
    expect(ElMessage.success).toHaveBeenCalledWith('房间创建成功，房间号：ROOM42')
  })

  it('shows a validation message when no rule is available', async () => {
    vi.mocked(roomApi.getRuleOptions).mockResolvedValue({
      success: false,
      message: 'rules unavailable',
    })

    const wrapper = mount(CreateRoomView, {
      global: { stubs: elementPlusStubs },
    })
    await flushPromises()

    await wrapper.find('button').trigger('click')

    expect(roomApi.createRoom).not.toHaveBeenCalled()
    expect(ElMessage.error).toHaveBeenCalledWith('请选择游戏规则')
  })
})
