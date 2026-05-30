import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { marketApi, type PublishedRuleSummary } from '../../api/market'
import RuleMarketHomeView from '../RuleMarketHomeView.vue'

const push = vi.fn()
const forkRule = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('../../api/market', async () => {
  const actual = await vi.importActual<typeof import('../../api/market')>('../../api/market')
  return {
    ...actual,
    marketApi: {
      ...actual.marketApi,
      listPublishedRules: vi.fn(),
    },
  }
})

vi.mock('../../composables/useRuleFork', () => ({
  useRuleFork: () => ({ forkRule }),
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

const rules: PublishedRuleSummary[] = [
  {
    id: 'builtin-war-rule',
    name: 'War 拼点战争',
    description: '连续 5 轮翻牌比大小。',
    type: '对战',
    developer: { id: 'system', name: 'WildCard 内置', avatar: '' },
    rating: 4.8,
    reviewCount: 12,
    publishedAt: new Date('2026-05-29T00:00:00Z').getTime(),
  },
  {
    id: 'rule-user-1',
    name: 'Tiny Demo Plus',
    description: '玩家自定义规则。',
    type: '策略',
    developer: { id: 'dev-1', name: 'Rule Lab', avatar: '/dev.png' },
    rating: 4.2,
    reviewCount: 3,
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
  ElSelect: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'change'],
    template: '<select v-bind="$attrs" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\', $event.target.value)"><slot /></select>',
  },
  ElOption: { props: ['label', 'value'], template: '<option :value="value">{{ label }}</option>' },
  ElSkeleton: { template: '<div class="skeleton" />' },
  ElEmpty: { props: ['description'], template: '<div class="empty">{{ description }}</div>' },
  ElTag: { template: '<span class="tag"><slot /></span>' },
  ElRate: { props: ['modelValue'], template: '<span class="rate">{{ modelValue }}</span>' },
}

function mountView() {
  return mount(RuleMarketHomeView, {
    global: { stubs },
  })
}

describe('RuleMarketHomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(marketApi.listPublishedRules).mockResolvedValue({ success: true, data: rules })
  })

  it('loads and renders published rule cards from the market API', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(marketApi.listPublishedRules).toHaveBeenCalledWith({ keyword: '', type: '' })
    expect(wrapper.text()).toContain('War 拼点战争')
    expect(wrapper.text()).toContain('连续 5 轮翻牌比大小。')
    expect(wrapper.text()).toContain('WildCard 内置')
    expect(wrapper.text()).toContain('4.8 · 12 条评价')
  })

  it('searches with keyword and selected type filters', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('.keyword-input').setValue('War')
    await wrapper.find('.type-select').setValue('对战')
    await wrapper.findAll('button').find(button => button.text() === '搜索')?.trigger('click')
    await flushPromises()

    expect(marketApi.listPublishedRules).toHaveBeenLastCalledWith({ keyword: 'War', type: '对战' })
  })

  it('opens details from a card while Fork uses the fork composable without navigating', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('.fork-btn').trigger('click')
    expect(forkRule).toHaveBeenCalledWith(rules[0])
    expect(push).not.toHaveBeenCalled()

    await wrapper.find('.rule-card').trigger('click')
    expect(push).toHaveBeenCalledWith('/rule-market/builtin-war-rule')
  })

  it('shows a load error when the market API fails', async () => {
    vi.mocked(marketApi.listPublishedRules).mockResolvedValueOnce({ success: false, message: 'market unavailable' })

    mountView()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('market unavailable')
  })
})
