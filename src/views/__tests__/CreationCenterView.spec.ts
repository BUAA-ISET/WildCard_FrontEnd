import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CreationCenterView from '../CreationCenterView.vue'
import { ruleApi, type RuleDraftSummary } from '../../api/rule'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../../api/rule', () => ({
  ruleApi: {
    listDrafts: vi.fn(),
    deleteDraft: vi.fn(),
  },
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
    ElMessageBox: {
      confirm: vi.fn().mockRejectedValue(new Error('cancel')),
    },
  }
})

const elButtonStub = {
  template: '<button @click="$emit(\'click\')"><slot /></button>',
}

function mountWithRules(rules: RuleDraftSummary[]) {
  vi.mocked(ruleApi.listDrafts).mockResolvedValue({ success: true, data: rules })
  return mount(CreationCenterView, {
    global: {
      stubs: {
        'el-button': elButtonStub,
      },
    },
  })
}

describe('CreationCenterView - status badges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('为 draft / pendingReview / published / rejected 四种状态各自渲染对应文案与样式', async () => {
    const rules: RuleDraftSummary[] = [
      { id: 'r1', name: '草稿规则', playerCount: 2, description: '', status: 'draft', updatedAt: 0 },
      { id: 'r2', name: '审核中规则', playerCount: 2, description: '', status: 'pendingReview', updatedAt: 0 },
      { id: 'r3', name: '已发布规则', playerCount: 2, description: '', status: 'published', updatedAt: 0 },
      { id: 'r4', name: '被驳回规则', playerCount: 2, description: '', status: 'rejected', updatedAt: 0, rejectReason: '描述不清' },
    ]
    const wrapper = mountWithRules(rules)
    await flushPromises()

    const pills = wrapper.findAll('.status-pill')
    expect(pills).toHaveLength(4)
    expect(pills[0].text()).toBe('草稿')
    expect(pills[0].classes()).toContain('draft')
    expect(pills[1].text()).toBe('审核中')
    expect(pills[1].classes()).toContain('pendingReview')
    expect(pills[2].text()).toBe('已发布')
    expect(pills[2].classes()).toContain('published')
    expect(pills[3].text()).toBe('已驳回')
    expect(pills[3].classes()).toContain('rejected')
  })

  it('rejected 状态行内展示驳回原因，并把原因带进徽章 title', async () => {
    const rules: RuleDraftSummary[] = [
      {
        id: 'r4',
        name: '被驳回规则',
        playerCount: 2,
        description: '',
        status: 'rejected',
        updatedAt: 0,
        rejectReason: '描述不清，请补充示例',
      },
    ]
    const wrapper = mountWithRules(rules)
    await flushPromises()

    const reason = wrapper.find('.reject-reason')
    expect(reason.exists()).toBe(true)
    expect(reason.text()).toContain('描述不清，请补充示例')

    const pill = wrapper.find('.status-pill.rejected')
    expect(pill.attributes('title')).toContain('描述不清')
  })

  it('rejected 但没有 rejectReason 时不渲染原因行', async () => {
    const rules: RuleDraftSummary[] = [
      { id: 'r4', name: '被驳回规则', playerCount: 2, description: '', status: 'rejected', updatedAt: 0 },
    ]
    const wrapper = mountWithRules(rules)
    await flushPromises()

    expect(wrapper.find('.reject-reason').exists()).toBe(false)
  })
})
