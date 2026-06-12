import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { reportApi } from '../../../api/report'
import { useUserStore } from '../../../stores/userStore'
import ReportButton from '../ReportButton.vue'
import ReportModal from '../ReportModal.vue'

const pushMock = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/battle/room-42' }),
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('../../../api/report', async () => {
  const actual = await vi.importActual<typeof import('../../../api/report')>('../../../api/report')
  return {
    ...actual,
    reportApi: {
      submit: vi.fn(),
    },
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
  }
})

const stubs = {
  ElDialog: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'closed'],
    template: '<div v-if="modelValue" class="dialog"><slot /><footer><slot name="footer" /></footer></div>',
  },
  ElForm: { template: '<form><slot /></form>' },
  ElFormItem: { props: ['label'], template: '<label><span>{{ label }}</span><slot /></label>' },
  ElInput: {
    props: ['modelValue', 'type'],
    emits: ['update:modelValue'],
    template: `
      <textarea
        v-if="type === 'textarea'"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <input
        v-else
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
  ElButton: {
    props: ['loading', 'disabled'],
    emits: ['click'],
    template: '<button type="button" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
  },
  ElTooltip: { template: '<span><slot /></span>' },
  ElIcon: { template: '<span><slot /></span>' },
  Warning: true,
}

describe('report components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(reportApi.submit).mockResolvedValue({ success: true, data: undefined })
  })

  it('redirects anonymous users to login instead of opening the modal', async () => {
    const wrapper = mount(ReportButton, {
      props: {
        targetType: 'rule',
        targetId: 'rule-1',
        targetLabel: '规则 A',
        tooltip: '举报规则',
      },
      global: { stubs },
    })

    await wrapper.find('button').trigger('click')

    expect(ElMessage.warning).toHaveBeenCalledWith('请先登录后再提交举报')
    expect(pushMock).toHaveBeenCalledWith('/user-info')
    expect(wrapper.emitted('opened')).toBeUndefined()
  })

  it('opens the modal for logged-in users', async () => {
    useUserStore().setUser({
      id: 'u-1',
      username: 'Alice',
      email: 'alice@example.com',
      avatar: '',
    })
    const wrapper = mount(ReportButton, {
      props: { targetType: 'user', targetId: 'u-2', tooltip: '举报用户' },
      global: { stubs },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('.dialog').exists()).toBe(true)
    expect(wrapper.emitted('opened')).toHaveLength(1)
  })

  it('submits a trimmed report payload with route source path and emits close events', async () => {
    useUserStore().setUser({
      id: 'u-1',
      username: 'Alice',
      email: 'alice@example.com',
      avatar: '/avatar.png',
    })
    const wrapper = mount(ReportModal, {
      props: {
        modelValue: true,
        targetType: 'player_behavior',
        targetId: 'room-42:u-2',
        targetLabel: 'Bob 的对局行为',
        context: { roomCode: '42', sessionId: 's-1' },
      },
      global: { stubs },
    })

    const textareas = wrapper.findAll('textarea')
    await textareas[0].setValue('  恶意拖延  ')
    await textareas[1].setValue('  最后一轮持续不操作  ')
    await wrapper.findAll('button').find(button => button.text() === '提交举报')?.trigger('click')
    await flushPromises()

    expect(reportApi.submit).toHaveBeenCalledWith({
      reporterId: 'u-1',
      reporterName: 'Alice',
      reporterAvatar: '/avatar.png',
      targetType: 'player_behavior',
      targetId: 'room-42:u-2',
      reason: '恶意拖延',
      details: '最后一轮持续不操作',
      context: {
        roomCode: '42',
        sessionId: 's-1',
        targetLabel: 'Bob 的对局行为',
        sourcePath: '/battle/room-42',
      },
    })
    expect(ElMessage.success).toHaveBeenCalledWith('举报已提交')
    expect(wrapper.emitted('submitted')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('blocks blank reasons before calling the API', async () => {
    const wrapper = mount(ReportModal, {
      props: { modelValue: true, targetType: 'rule', targetId: 'rule-1' },
      global: { stubs },
    })

    await wrapper.findAll('button').find(button => button.text() === '提交举报')?.trigger('click')

    expect(reportApi.submit).not.toHaveBeenCalled()
    expect(ElMessage.warning).toHaveBeenCalledWith('请填写举报理由')
  })
})
