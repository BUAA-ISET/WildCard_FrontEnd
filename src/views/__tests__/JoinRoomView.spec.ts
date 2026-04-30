import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { roomApi } from '../../api/room'
import { elementPlusStubs } from '../../test-utils/elementPlusStubs'
import JoinRoomView from '../JoinRoomView.vue'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('../../api/room', () => ({
  roomApi: {
    checkRoomPassword: vi.fn(),
    joinRoom: vi.fn(),
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

function mockJoinedRoom(code: string) {
  vi.mocked(roomApi.joinRoom).mockResolvedValue({
    success: true,
    data: {
      id: 'room-1',
      code,
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
}

describe('JoinRoomView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('rejects an empty room code before calling the API', async () => {
    const wrapper = mount(JoinRoomView, {
      global: { stubs: elementPlusStubs },
    })

    await wrapper.find('button').trigger('click')

    expect(roomApi.checkRoomPassword).not.toHaveBeenCalled()
    expect(ElMessage.error).toHaveBeenCalledWith('请输入房间号')
  })

  it('joins a room without a password and navigates to the game page', async () => {
    vi.mocked(roomApi.checkRoomPassword).mockResolvedValue({
      success: true,
      hasPassword: false,
    })
    mockJoinedRoom('222333')

    const wrapper = mount(JoinRoomView, {
      global: { stubs: elementPlusStubs },
    })

    await wrapper.find('input').setValue('222333')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(roomApi.joinRoom).toHaveBeenCalledWith({ code: '222333' })
    expect(sessionStorage.getItem('currentRoomCode')).toBe('222333')
    expect(push).toHaveBeenCalledWith('/game/222333')
  })

  it('prompts for a password before joining a protected room', async () => {
    vi.mocked(roomApi.checkRoomPassword).mockResolvedValue({
      success: true,
      hasPassword: true,
    })
    mockJoinedRoom('123456')

    const wrapper = mount(JoinRoomView, {
      global: { stubs: elementPlusStubs },
    })

    await wrapper.find('input').setValue('123456')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('密码')

    await wrapper.find('input').setValue('abc123')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(roomApi.joinRoom).toHaveBeenCalledWith({
      code: '123456',
      password: 'abc123',
    })
    expect(push).toHaveBeenCalledWith('/game/123456')
  })
})
