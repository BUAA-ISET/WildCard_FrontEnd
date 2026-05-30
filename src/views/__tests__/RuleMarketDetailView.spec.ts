import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { marketApi, type PublishedRuleDetail } from '../../api/market'
import RuleMarketDetailView from '../RuleMarketDetailView.vue'

const push = vi.fn()
const forkRule = vi.fn()

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
      getPublishedRuleDetail: vi.fn(),
      postRuleReview: vi.fn(),
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
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  }
})

const rule: PublishedRuleDetail = {
  id: 'builtin-war-rule',
  name: 'War 拼点战争',
  description: '连续 5 轮翻牌比大小。',
  introduction: '每名玩家翻出一张牌，点数更高者获得本轮胜场。',
  type: '对战',
  developer: { id: 'system', name: 'WildCard 内置', avatar: '' },
  rating: 4.8,
  reviewCount: 12,
  publishedAt: new Date('2026-05-29T00:00:00Z').getTime(),
  screenshots: [],
  reviews: [
    {
      id: 'review-1',
      authorName: '测试玩家',
      authorAvatar: '/avatar.png',
      rating: 5,
      content: '节奏很快',
      createdAt: new Date('2026-05-29T01:00:00Z').getTime(),
    },
  ],
}

const stubs = {
  ElButton: { emits: ['click'], inheritAttrs: false, template: '<button type="button" @click="$emit(\'click\')"><slot /></button>' },
  ElSkeleton: { template: '<div class="skeleton" />' },
  ElEmpty: { props: ['description'], template: '<div class="empty">{{ description }}</div>' },
  ElTag: { template: '<span class="tag"><slot /></span>' },
  ElRate: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input class="rate" type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
  },
  ElInput: {
    props: ['modelValue', 'type'],
    emits: ['update:modelValue'],
    template: '<textarea v-if="type === \'textarea\'" v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /><input v-else v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  ElUpload: { template: '<div class="upload"><slot /></div>' },
  ElCarousel: { template: '<div class="carousel"><slot /></div>' },
  ElCarouselItem: { template: '<div class="carousel-item"><slot /></div>' },
}

function mountView() {
  return mount(RuleMarketDetailView, {
    global: { stubs },
  })
}

describe('RuleMarketDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(marketApi.getPublishedRuleDetail).mockResolvedValue({ success: true, data: structuredClone(rule) })
    vi.mocked(marketApi.postRuleReview).mockResolvedValue({
      success: true,
      data: {
        id: 'review-2',
        authorName: '我',
        authorAvatar: '/me.png',
        rating: 5,
        content: '值得推荐',
        createdAt: new Date('2026-05-30T00:00:00Z').getTime(),
      },
    })
  })

  it('loads and renders rule detail, developer, intro, and existing reviews', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(marketApi.getPublishedRuleDetail).toHaveBeenCalledWith('builtin-war-rule')
    expect(wrapper.text()).toContain('War 拼点战争')
    expect(wrapper.text()).toContain('每名玩家翻出一张牌')
    expect(wrapper.text()).toContain('WildCard 内置')
    expect(wrapper.text()).toContain('节奏很快')
  })

  it('navigates to developer, room search, and quick create destinations', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('.developer-card').trigger('click')
    expect(push).toHaveBeenCalledWith('/rule-market/developer/system')

    await wrapper.findAll('button').find(button => button.text() === '搜索房间')?.trigger('click')
    expect(push).toHaveBeenCalledWith('/rule-market/builtin-war-rule/rooms')

    await wrapper.findAll('button').find(button => button.text() === '快速使用规则')?.trigger('click')
    expect(push).toHaveBeenCalledWith({
      path: '/create-room',
      query: { ruleId: 'builtin-war-rule', ruleName: 'War 拼点战争' },
    })
  })

  it('uses the fork composable from the detail action', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text() === 'Fork 规则')?.trigger('click')

    expect(forkRule).toHaveBeenCalledWith({ id: 'builtin-war-rule', name: 'War 拼点战争' })
  })

  it('submits a trimmed review and prepends the returned review', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('textarea').setValue('  值得推荐  ')
    await wrapper.findAll('button').find(button => button.text() === '提交评论')?.trigger('click')
    await flushPromises()

    expect(marketApi.postRuleReview).toHaveBeenCalledWith('builtin-war-rule', {
      rating: 5,
      content: '值得推荐',
      imageUrl: undefined,
    })
    expect(wrapper.text()).toContain('我')
    expect(wrapper.text()).toContain('值得推荐')
    expect(ElMessage.success).toHaveBeenCalledWith('评论已提交')
  })

  it('shows a load error when rule detail is unavailable', async () => {
    vi.mocked(marketApi.getPublishedRuleDetail).mockResolvedValueOnce({ success: false, message: 'detail unavailable' })

    mountView()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('detail unavailable')
  })

  it('shows an error when review submission fails', async () => {
    vi.mocked(marketApi.postRuleReview).mockResolvedValueOnce({ success: false, message: 'review failed' })
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('textarea').setValue('值得推荐')
    await wrapper.findAll('button').find(button => button.text() === '提交评论')?.trigger('click')
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('review failed')
    expect(ElMessage.success).not.toHaveBeenCalled()
  })

  it('warns instead of submitting empty reviews', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text() === '提交评论')?.trigger('click')

    expect(marketApi.postRuleReview).not.toHaveBeenCalled()
    expect(ElMessage.warning).toHaveBeenCalledWith('请填写评论内容')
  })
})
