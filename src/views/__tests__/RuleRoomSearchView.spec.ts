import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { marketApi, type PublishedRuleDetail, type RuleRoom } from '../../api/market'
import RuleRoomSearchView from '../RuleRoomSearchView.vue'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { ruleId: 'builtin-war-rule' } }),
  useRouter: () => ({ push }),
}))

vi.mock('../../api/market', async () => {
  const actual = await vi.importActual<typeof import('../../api/market')>('../../api/market')
  return {
    ...actual,
    marketApi: {
      ...actual.marketApi,
      listRuleRooms: vi.fn(),
      getPublishedRuleDetail: vi.fn(),
    },
  }
})

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
    },
  }
})

const detail: PublishedRuleDetail = {
  id: 'builtin-war-rule',
  name: 'War 拼点战争',
  description: '连续 5 轮翻牌比大小。',
  introduction: '每名玩家翻出一张牌。',
  type: '对战',
  developer: { id: 'system', name: 'WildCard 内置', avatar: '' },
  rating: 4.8,
  reviewCount: 12,
  publishedAt: new Date('2026-05-29T00:00:00Z').getTime(),
  screenshots: [],
  reviews: [],
}

const rooms: RuleRoom[] = [
  {
    id: 'room-1',
    code: 'A1B2C3',
    hostName: '房主A',
    currentPlayers: 1,
    maxPlayers: 2,
    hasPassword: false,
    status: 'waiting',
  },
  {
    id: 'room-2',
    code: 'D4E5F6',
    hostName: '房主B',
    currentPlayers: 2,
    maxPlayers: 2,
    hasPassword: true,
    status: 'playing',
  },
]

const stubs = {
  ElButton: { props: ['disabled'], emits: ['click'], inheritAttrs: false, template: '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>' },
  ElSkeleton: { template: '<div class="skeleton" />' },
  ElEmpty: { props: ['description'], template: '<div class="empty">{{ description }}</div>' },
  ElTag: { props: ['type'], template: '<span class="tag"><slot /></span>' },
  ElIcon: { template: '<span><slot /></span>' },
  Lock: { template: '<span class="lock" />' },
  Unlock: { template: '<span class="unlock" />' },
}

function mountView() {
  return mount(RuleRoomSearchView, {
    global: { stubs },
  })
}

describe('RuleRoomSearchView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(marketApi.listRuleRooms).mockResolvedValue({ success: true, data: rooms })
    vi.mocked(marketApi.getPublishedRuleDetail).mockResolvedValue({ success: true, data: detail })
  })

  it('loads rule title and online rooms for the selected rule', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(marketApi.listRuleRooms).toHaveBeenCalledWith('builtin-war-rule')
    expect(marketApi.getPublishedRuleDetail).toHaveBeenCalledWith('builtin-war-rule')
    expect(wrapper.text()).toContain('War 拼点战争')
    expect(wrapper.text()).toContain('当前在线房间 2 个')
    expect(wrapper.text()).toContain('A1B2C3')
    expect(wrapper.text()).toContain('房主A')
    expect(wrapper.text()).toContain('1 / 2')
  })

  it('opens quick create with the selected rule id and loaded title', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text() === '快速创建房间')?.trigger('click')

    expect(push).toHaveBeenCalledWith({
      path: '/create-room',
      query: { ruleId: 'builtin-war-rule', ruleName: 'War 拼点战争' },
    })
  })

  it('opens join room with the selected room code', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text() === '加入' && !button.attributes('disabled'))?.trigger('click')

    expect(push).toHaveBeenCalledWith({
      path: '/join-room',
      query: { code: 'A1B2C3' },
    })
  })

  it('shows a load error when the room list is unavailable', async () => {
    vi.mocked(marketApi.listRuleRooms).mockResolvedValueOnce({ success: false, message: 'rooms unavailable' })

    mountView()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('rooms unavailable')
  })
})
