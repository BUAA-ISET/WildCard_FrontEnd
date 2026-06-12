import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reportApi, type Report } from '../../api/report'
import AdminReportDetail from '../../components/report/AdminReportDetail.vue'
import AdminReportReviewView from '../AdminReportReviewView.vue'

vi.mock('../../api/report', async () => {
  const actual = await vi.importActual<typeof import('../../api/report')>('../../api/report')
  return {
    ...actual,
    reportApi: {
      list: vi.fn(),
      counts: vi.fn(),
      action: vi.fn(),
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
    ElMessageBox: {
      prompt: vi.fn(),
    },
  }
})

const reports: Report[] = [
  {
    id: 'report-1',
    reporterId: 'u-1',
    reporterName: 'Alice',
    reporterAvatar: '/avatar.png',
    targetType: 'player_behavior',
    targetId: 'room-42:u-2',
    reason: '恶意拖延',
    details: '最后一轮持续不操作',
    status: 'pending',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    context: { targetLabel: 'Bob 的对局行为', sourcePath: '/battle/room-42' },
  },
  {
    id: 'report-2',
    reporterId: 'u-3',
    reporterName: 'Carol',
    targetType: 'rule',
    targetId: 'rule-9',
    reason: '疑似抄袭',
    details: '',
    status: 'pending',
    createdAt: 1700000100000,
    updatedAt: 1700000100000,
  },
]

const buttonStub = {
  props: ['loading', 'disabled', 'type'],
  emits: ['click'],
  template: '<button type="button" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
}

const stubs = {
  ElButton: buttonStub,
  ElTag: { props: ['type'], template: '<span class="tag"><slot /></span>' },
  ElSelect: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  },
  ElOption: { props: ['label', 'value'], template: '<option :value="value">{{ label }}</option>' },
  ElInput: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'clear'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  ElEmpty: { props: ['description'], template: '<div class="empty">{{ description }}</div>' },
}

function mountView() {
  return mount(AdminReportReviewView, { global: { stubs } })
}

describe('AdminReportReviewView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(reportApi.list).mockResolvedValue({ success: true, data: reports.map(report => ({ ...report })) })
    vi.mocked(reportApi.counts).mockResolvedValue({ success: true, data: { pending: 2 } })
    vi.mocked(reportApi.action).mockResolvedValue({ success: true, data: { ...reports[0], status: 'resolved' } })
  })

  it('loads pending reports, selects the first report, and displays pending count', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(reportApi.list).toHaveBeenCalledWith({ status: 'pending', targetType: 'all', keyword: '' })
    expect(reportApi.counts).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('待处理 2')
    expect(wrapper.findAll('.report-list-item')).toHaveLength(2)
    expect(wrapper.text()).toContain('Bob 的对局行为')
    expect(wrapper.text()).toContain('/battle/room-42')
  })

  it('runs selected report actions with note and target params, then reloads', async () => {
    vi.mocked(ElMessageBox.prompt).mockResolvedValueOnce({ value: '已核实，封禁用户', action: 'confirm' } as never)
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('.detail-actions button')[0].trigger('click')
    await flushPromises()

    expect(ElMessageBox.prompt).toHaveBeenCalledWith(
      '确认执行“封禁用户”吗？请填写处理备注。',
      '封禁用户',
      expect.objectContaining({ inputType: 'textarea' }),
    )
    expect(reportApi.action).toHaveBeenCalledWith('report-1', {
      action: 'ban_user',
      note: '已核实，封禁用户',
      params: { targetType: 'player_behavior', targetId: 'room-42:u-2' },
    })
    expect(ElMessage.success).toHaveBeenCalledWith('处理完成')
    expect(reportApi.list).toHaveBeenCalledTimes(2)
  })

  it('does not call action when the prompt is cancelled', async () => {
    vi.mocked(ElMessageBox.prompt).mockRejectedValueOnce(new Error('cancel'))
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('.detail-actions button')[2].trigger('click')
    await flushPromises()

    expect(reportApi.action).not.toHaveBeenCalled()
  })

  it('shows an error when report list loading fails', async () => {
    vi.mocked(reportApi.list).mockResolvedValueOnce({ success: false, message: '权限不足' })

    mountView()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('权限不足')
  })
})

describe('AdminReportDetail', () => {
  it('enables only user-ban actions for player behavior reports and renders action log', () => {
    const wrapper = mount(AdminReportDetail, {
      props: {
        report: {
          ...reports[0],
          actionLog: [{ id: 'a-1', action: 'dismiss', operatorId: 'admin', note: '证据不足', createdAt: 1700000200000 }],
        },
      },
      global: { stubs },
    })

    const buttons = wrapper.findAll('.detail-actions button')
    expect(buttons[0].attributes('disabled')).toBeUndefined()
    expect(buttons[1].attributes('disabled')).toBeDefined()
    expect(buttons[2].attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('处理记录')
    expect(wrapper.text()).toContain('证据不足')
  })

  it('enables only rule-ban actions for rule reports and disables all actions after resolution', async () => {
    const wrapper = mount(AdminReportDetail, {
      props: { report: reports[1] },
      global: { stubs },
    })

    let buttons = wrapper.findAll('.detail-actions button')
    expect(buttons[0].attributes('disabled')).toBeDefined()
    expect(buttons[1].attributes('disabled')).toBeUndefined()
    expect(buttons[2].attributes('disabled')).toBeUndefined()

    await wrapper.setProps({ report: { ...reports[1], status: 'resolved' } })
    buttons = wrapper.findAll('.detail-actions button')
    expect(buttons.every(button => button.attributes('disabled') !== undefined)).toBe(true)
  })
})
