import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { marketApi, type PublishedRuleSummary } from '../../api/market'
import RuleDeveloperDetailView from '../RuleDeveloperDetailView.vue'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { developerId: 'system' } }),
  useRouter: () => ({ push }),
}))

vi.mock('../../api/market', async () => {
  const actual = await vi.importActual<typeof import('../../api/market')>('../../api/market')
  return {
    ...actual,
    marketApi: {
      ...actual.marketApi,
      listDeveloperRules: vi.fn(),
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

const rules: PublishedRuleSummary[] = [
  {
    id: 'builtin-war-rule',
    name: 'War 拼点战争',
    description: '连续 5 轮翻牌比大小。',
    type: '对战',
    developer: {
      id: 'system',
      name: 'WildCard 内置',
      avatar: '',
      bio: '官方内置规则。',
    },
    rating: 4.8,
    reviewCount: 12,
    publishedAt: new Date('2026-05-29T00:00:00Z').getTime(),
  },
  {
    id: 'builtin-duel-rule',
    name: 'Duel Demo',
    description: '轻量对战规则。',
    type: '策略',
    developer: {
      id: 'system',
      name: 'WildCard 内置',
      avatar: '',
      bio: '官方内置规则。',
    },
    rating: 4.4,
    reviewCount: 5,
    publishedAt: new Date('2026-05-28T00:00:00Z').getTime(),
  },
]

const stubs = {
  ElButton: { emits: ['click'], inheritAttrs: false, template: '<button type="button" @click="$emit(\'click\')"><slot /></button>' },
  ElIcon: { template: '<span><slot /></span>' },
  Search: { template: '<span class="search-icon" />' },
  ElInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'clear'],
    template: '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  ElSkeleton: { template: '<div class="skeleton" />' },
  ElEmpty: { props: ['description'], template: '<div class="empty">{{ description }}</div>' },
  ElTag: { template: '<span class="tag"><slot /></span>' },
  ElRate: { props: ['modelValue'], template: '<span class="rate">{{ modelValue }}</span>' },
  ReportButton: true,
}

function mountView() {
  return mount(RuleDeveloperDetailView, {
    global: { stubs },
  })
}

describe('RuleDeveloperDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(marketApi.listDeveloperRules).mockResolvedValue({ success: true, data: rules })
  })

  it('loads and renders developer profile data from the first returned rule', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(marketApi.listDeveloperRules).toHaveBeenCalledWith('system', { keyword: '' })
    expect(wrapper.text()).toContain('WildCard 内置')
    expect(wrapper.text()).toContain('官方内置规则。')
    expect(wrapper.text()).toContain('War 拼点战争')
    expect(wrapper.text()).toContain('Duel Demo')
  })

  it('searches this developer rules by keyword', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('input[placeholder="搜索该开发者发布的规则"]').setValue('War')
    await wrapper.findAll('button').find(button => button.text() === '搜索')?.trigger('click')
    await flushPromises()

    expect(marketApi.listDeveloperRules).toHaveBeenLastCalledWith('system', { keyword: 'War' })
  })

  it('opens a selected rule detail page', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('.rule-row').trigger('click')

    expect(push).toHaveBeenCalledWith('/rule-market/builtin-war-rule')
  })

  it('shows a load error when developer rules are unavailable', async () => {
    vi.mocked(marketApi.listDeveloperRules).mockResolvedValueOnce({ success: false, message: 'developer unavailable' })

    mountView()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('developer unavailable')
  })
})
