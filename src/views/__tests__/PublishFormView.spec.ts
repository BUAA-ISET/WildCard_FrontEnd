import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { ruleApi, type RuleDraftDetail } from '../../api/rule'
import PublishFormView from '../PublishFormView.vue'

const push = vi.fn()
const replace = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { draftId: 'draft-1' } }),
  useRouter: () => ({ push, replace }),
}))

vi.mock('../../api/rule', () => ({
  ruleApi: {
    getDraft: vi.fn(),
    updateDraft: vi.fn(),
    submitReview: vi.fn(),
    uploadRuleImage: vi.fn(),
  },
}))

vi.mock('../../api/config', () => ({
  getApiUrl: (endpoint: string) => `http://test${endpoint}`,
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

const baseDraft: RuleDraftDetail = {
  id: 'draft-1',
  name: '示例规则',
  playerCount: 2,
  description: '描述',
  status: 'draft',
  updatedAt: 0,
  createdAt: 0,
  introduction: '原始介绍',
  coverUrl: '/static/rule-images/old-cover.png',
  screenshotUrls: ['/static/rule-images/shot-a.png'],
  design: { foo: 'bar' } as never,
}

const stubs = {
  ElButton: {
    inheritAttrs: false,
    emits: ['click'],
    props: ['loading', 'disabled', 'type'],
    template: '<button type="button" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
  },
  ElSkeleton: { template: '<div class="skeleton" />' },
  ElInput: {
    props: ['modelValue', 'type'],
    emits: ['update:modelValue'],
    template:
      '<textarea v-if="type === \'textarea\'" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' +
      '<input v-else :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  ElUpload: {
    props: ['onChange'],
    template: '<div class="upload" @click="$emit(\'trigger\')"><slot /></div>',
  },
}

function mountView() {
  return mount(PublishFormView, { global: { stubs } })
}

function cloneDraft(overrides: Partial<RuleDraftDetail> = {}): RuleDraftDetail {
  return { ...baseDraft, ...overrides }
}

describe('PublishFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ruleApi.getDraft).mockResolvedValue({ success: true, data: cloneDraft() })
    vi.mocked(ruleApi.updateDraft).mockResolvedValue({ success: true, data: { id: 'draft-1', updatedAt: 1 } })
    vi.mocked(ruleApi.submitReview).mockResolvedValue({
      success: true,
      data: { id: 'draft-1', status: 'pendingReview', updatedAt: 2 },
    })
    vi.mocked(ruleApi.uploadRuleImage).mockResolvedValue({
      success: true,
      data: { imageUrl: '/static/rule-images/new.png' },
    })
  })

  it('进入页面拉 draft 并把 introduction / coverUrl / screenshotUrls 渲染到表单', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(ruleApi.getDraft).toHaveBeenCalledWith('draft-1')
    expect(wrapper.find('textarea').element.value).toBe('原始介绍')
    expect(wrapper.find('.cover-preview img').attributes('src')).toContain('old-cover.png')
    expect(wrapper.findAll('.shot-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('示例规则')
  })

  it('点"提交审核"先保存草稿再调 submitReview', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('textarea').setValue('新的介绍\n第二行')
    const submitBtn = wrapper.findAll('button').find(btn => btn.text() === '提交审核')
    expect(submitBtn).toBeDefined()
    await submitBtn!.trigger('click')
    await flushPromises()

    expect(ruleApi.updateDraft).toHaveBeenCalled()
    const payload = vi.mocked(ruleApi.updateDraft).mock.calls.at(-1)?.[1]
    expect(payload?.introduction).toBe('新的介绍\n第二行')
    expect(payload?.coverUrl).toBe('/static/rule-images/old-cover.png')
    expect(payload?.screenshotUrls).toEqual(['/static/rule-images/shot-a.png'])
    expect(ruleApi.submitReview).toHaveBeenCalledWith('draft-1')
    expect(ElMessage.success).toHaveBeenCalledWith('规则已提交审核，请等待审核员处理')
    // 按钮文案在 status 切到 pendingReview 后应变成"审核中"
    expect(wrapper.findAll('button').some(btn => btn.text() === '审核中')).toBe(true)
  })

  it('上传封面成功后写入字段并 persist；持久化失败时回滚封面 URL', async () => {
    const wrapper = mountView()
    await flushPromises()

    // 仅保存草稿应能命中 updateDraft
    const saveBtn = wrapper.findAll('button').find(btn => btn.text() === '保存草稿')
    await saveBtn!.trigger('click')
    await flushPromises()
    expect(ElMessage.success).toHaveBeenCalledWith('草稿已保存')

    // 模拟封面上传时 persist 失败，触发回滚
    vi.mocked(ruleApi.updateDraft).mockResolvedValueOnce({ success: false, message: '保存失败' })
    const componentInstance = wrapper.vm as unknown as {
      handleCoverChange: (file: { raw: File }) => Promise<void>
      coverUrl: string
    }
    const fakeFile = new File(['x'], 'cover.png', { type: 'image/png' })
    await componentInstance.handleCoverChange({ raw: fakeFile })
    await flushPromises()

    // upload 成功了但 persist 失败 → coverUrl 应被回滚到旧值
    expect(ruleApi.uploadRuleImage).toHaveBeenCalledWith('draft-1', fakeFile)
    expect(componentInstance.coverUrl).toBe('/static/rule-images/old-cover.png')
    expect(ElMessage.error).toHaveBeenCalledWith('保存失败')
  })

  it('rejected 状态展示驳回原因提示条，按钮文案为"重新提交审核"', async () => {
    vi.mocked(ruleApi.getDraft).mockResolvedValueOnce({
      success: true,
      data: cloneDraft({ status: 'rejected', rejectReason: '请补充示例图片' }),
    })
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.reject-banner').exists()).toBe(true)
    expect(wrapper.find('.reject-banner').text()).toContain('请补充示例图片')
    expect(wrapper.findAll('button').some(btn => btn.text() === '重新提交审核')).toBe(true)
  })

  it('截图上传成功后追加 URL；删除截图同步 persist 失败时回滚', async () => {
    const wrapper = mountView()
    await flushPromises()

    const componentInstance = wrapper.vm as unknown as {
      handleScreenshotChange: (file: { raw: File }) => Promise<void>
      removeScreenshot: (index: number) => Promise<void>
      screenshotUrls: string[]
    }
    const fakeFile = new File(['x'], 'shot.png', { type: 'image/png' })
    await componentInstance.handleScreenshotChange({ raw: fakeFile })
    await flushPromises()
    expect(componentInstance.screenshotUrls).toEqual([
      '/static/rule-images/shot-a.png',
      '/static/rule-images/new.png',
    ])

    // 删除时 persist 失败 → 回滚到删除前
    vi.mocked(ruleApi.updateDraft).mockResolvedValueOnce({ success: false, message: '保存失败' })
    await componentInstance.removeScreenshot(0)
    await flushPromises()
    expect(componentInstance.screenshotUrls).toEqual([
      '/static/rule-images/shot-a.png',
      '/static/rule-images/new.png',
    ])
  })
})
