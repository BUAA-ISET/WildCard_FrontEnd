import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminRuleReviewView from '../AdminRuleReviewView.vue'
import { adminApi, type PendingReviewDraft } from '../../api/admin'

vi.mock('../../api/admin', () => ({
  adminApi: {
    listPending: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  },
}))

vi.mock('../../api/config', () => ({
  getApiUrl: (endpoint: string) => `http://test${endpoint}`,
}))

const resolveMock = vi.fn((path: string) => ({ href: path }))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      resolve: resolveMock,
      push: vi.fn(),
      replace: vi.fn(),
    }),
  }
})

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
      confirm: vi.fn(),
      prompt: vi.fn(),
    },
  }
})

const elButtonStub = {
  inheritAttrs: false,
  emits: ['click'],
  props: ['loading', 'disabled', 'type'],
  template:
    '<button type="button" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
}

const stubs = {
  ElButton: elButtonStub,
  ElEmpty: {
    props: ['description'],
    template: '<div class="el-empty">{{ description }}</div>',
  },
}

const pendingFixture: PendingReviewDraft[] = [
  {
    draftId: 'd-alpha',
    name: 'Alpha 规则',
    ownerId: 'u-1',
    ownerName: 'Alice',
    playerCount: 2,
    description: '简短描述',
    updatedAt: 1700000000000,
    design: { nodes: [{ id: 'n1' }] },
    introduction: '玩法 A',
    coverUrl: '/static/rule-images/cover-alpha.png',
    screenshotUrls: ['/static/rule-images/shot-1.png'],
  },
  {
    draftId: 'd-beta',
    name: 'Beta 规则',
    ownerId: 'u-2',
    ownerName: 'Bob',
    playerCount: 4,
    description: '另一个描述',
    updatedAt: 1700000050000,
    design: { nodes: [] },
  },
]

function mountView() {
  return mount(AdminRuleReviewView, { global: { stubs } })
}

describe('AdminRuleReviewView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminApi.listPending).mockResolvedValue({
      success: true,
      data: pendingFixture.map(item => ({ ...item })),
    })
    vi.mocked(adminApi.approve).mockResolvedValue({
      success: true,
      data: { ruleId: 'r-new', version: 1, status: 'published' },
    })
    vi.mocked(adminApi.reject).mockResolvedValue({
      success: true,
      data: { id: 'd-alpha', status: 'rejected', updatedAt: 1 },
    })
  })

  it('挂载时拉取待审列表并渲染', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(adminApi.listPending).toHaveBeenCalledTimes(1)
    const rows = wrapper.findAll('.pending-row')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Alpha 规则')
    expect(rows[0].text()).toContain('Alice')
  })

  it('待审列表为空时渲染暂无待审规则提示', async () => {
    vi.mocked(adminApi.listPending).mockResolvedValueOnce({ success: true, data: [] })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('暂无待审规则')
    expect(wrapper.findAll('.pending-row')).toHaveLength(0)
  })

  it('选中条目后右侧详情区显示作者 / 介绍 / 截图 / design 折叠按钮', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('.pending-row')[0].trigger('click')
    await flushPromises()

    const detail = wrapper.find('.detail-panel')
    expect(detail.text()).toContain('Alpha 规则')
    expect(detail.text()).toContain('Alice')
    expect(detail.text()).toContain('玩法 A')
    expect(wrapper.find('.detail-cover').exists()).toBe(true)
    expect(wrapper.find('.detail-cover').attributes('src')).toBe(
      'http://test/static/rule-images/cover-alpha.png',
    )
    expect(wrapper.findAll('.detail-screenshot')).toHaveLength(1)

    // design 默认折叠，点击切换显示
    expect(wrapper.find('.design-json').exists()).toBe(false)
    await wrapper.find('.design-toggle').trigger('click')
    const jsonBlock = wrapper.find('.design-json')
    expect(jsonBlock.exists()).toBe(true)
    expect(jsonBlock.text()).toContain('"nodes"')
  })

  it('点击批准走 ElMessageBox.confirm，确认后调 approve 并刷新列表', async () => {
    vi.mocked(ElMessageBox.confirm).mockResolvedValueOnce('confirm' as never)
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('.pending-row')[0].trigger('click')
    await flushPromises()

    const approveBtn = wrapper.findAll('.detail-actions button')[0]
    await approveBtn.trigger('click')
    await flushPromises()

    expect(ElMessageBox.confirm).toHaveBeenCalledTimes(1)
    expect(adminApi.approve).toHaveBeenCalledWith('d-alpha')
    expect(ElMessage.success).toHaveBeenCalledWith('规则已批准发布')
    // 批准后会重新拉一次列表（共 2 次）
    expect(adminApi.listPending).toHaveBeenCalledTimes(2)
  })

  it('批准被用户取消时不调用 approve', async () => {
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'))
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('.pending-row')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.detail-actions button')[0].trigger('click')
    await flushPromises()

    expect(adminApi.approve).not.toHaveBeenCalled()
  })

  it('点击驳回走 ElMessageBox.prompt，输入原因后调 reject 并刷新', async () => {
    vi.mocked(ElMessageBox.prompt).mockResolvedValueOnce({
      value: '描述不清，请补充示例',
      action: 'confirm',
    } as never)
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('.pending-row')[0].trigger('click')
    await flushPromises()

    const rejectBtn = wrapper.findAll('.detail-actions button')[1]
    await rejectBtn.trigger('click')
    await flushPromises()

    expect(ElMessageBox.prompt).toHaveBeenCalledTimes(1)
    expect(adminApi.reject).toHaveBeenCalledWith('d-alpha', '描述不清，请补充示例')
    expect(ElMessage.success).toHaveBeenCalledWith('规则已驳回')
    expect(adminApi.listPending).toHaveBeenCalledTimes(2)
  })

  it('listPending 失败时通过 ElMessage.error 提示', async () => {
    vi.mocked(adminApi.listPending).mockResolvedValueOnce({ success: false, message: '权限不足' })

    mountView()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('权限不足')
  })

  it('点击"可视化预览"按钮在新窗打开 RuleBuilderView 只读预览', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null as never)
    resolveMock.mockClear()

    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('.pending-row')[0].trigger('click')
    await flushPromises()

    const previewBtn = wrapper
      .findAll('.detail-header-actions button')
      .find(btn => btn.text().includes('可视化预览'))
    expect(previewBtn).toBeTruthy()
    await previewBtn!.trigger('click')

    expect(resolveMock).toHaveBeenCalledWith('/admin/rules-review/preview/d-alpha')
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy).toHaveBeenCalledWith(
      '/admin/rules-review/preview/d-alpha',
      '_blank',
      'noopener,noreferrer',
    )

    openSpy.mockRestore()
  })
})
