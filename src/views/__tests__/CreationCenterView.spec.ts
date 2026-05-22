import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ruleApi } from '../../api/rule'
import { elementPlusStubs } from '../../test-utils/elementPlusStubs'
import CreationCenterView from '../CreationCenterView.vue'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
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
    },
    ElMessageBox: {
      confirm: vi.fn(),
    },
  }
})

const drafts = [
  {
    id: 'draft 1',
    name: 'Rule One',
    playerCount: 2,
    description: 'first rule',
    status: 'draft' as const,
    updatedAt: 1_700_000_000_000,
  },
  {
    id: 'draft-2',
    name: 'Rule Two',
    playerCount: 4,
    description: '',
    status: 'published' as const,
    updatedAt: 1_700_100_000_000,
  },
]

describe('CreationCenterView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the empty state and navigates to a new draft', async () => {
    vi.mocked(ruleApi.listDrafts).mockResolvedValue({ success: true, data: [] })

    const wrapper = mount(CreationCenterView, {
      global: { stubs: elementPlusStubs },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('暂无规则')

    const createButton = wrapper.findAll('button').find(button => button.text().includes('创建新规则'))
    await createButton?.trigger('click')

    expect(push).toHaveBeenCalledWith('/creation-center/new')
  })

  it('renders draft rows and opens the selected draft', async () => {
    vi.mocked(ruleApi.listDrafts).mockResolvedValue({ success: true, data: drafts })

    const wrapper = mount(CreationCenterView, {
      global: { stubs: elementPlusStubs },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Rule One')
    expect(wrapper.text()).toContain('Rule Two')

    await wrapper.find('.rule-row').trigger('click')

    expect(push).toHaveBeenCalledWith('/creation-center/draft%201')
  })

  it('deletes a confirmed single draft and updates the list', async () => {
    vi.mocked(ruleApi.listDrafts).mockResolvedValue({ success: true, data: [drafts[0]] })
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(undefined as never)
    vi.mocked(ruleApi.deleteDraft).mockResolvedValue({ success: true, data: drafts[0] })

    const wrapper = mount(CreationCenterView, {
      global: { stubs: elementPlusStubs },
    })
    await flushPromises()

    await wrapper.find('.delete-action').trigger('click')
    await flushPromises()

    expect(ElMessageBox.confirm).toHaveBeenCalledWith(
      '确定要删除规则“Rule One”吗？删除后无法恢复。',
      '删除规则',
      expect.any(Object),
    )
    expect(ruleApi.deleteDraft).toHaveBeenCalledWith('draft 1')
    expect(wrapper.find('.rule-row').exists()).toBe(false)
    expect(ElMessage.success).toHaveBeenCalledWith('规则已删除')
  })

  it('shows an error when drafts fail to load', async () => {
    vi.mocked(ruleApi.listDrafts).mockResolvedValue({ success: false, message: '规则列表不可用' })

    mount(CreationCenterView, {
      global: { stubs: elementPlusStubs },
    })
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('规则列表不可用')
  })
})
