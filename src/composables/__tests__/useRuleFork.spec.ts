import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRuleFork } from '../useRuleFork'
import { marketApi } from '../../api/market'
import { useUserStore } from '../../stores/userStore'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('../../api/market', async () => {
  const actual = await vi.importActual<typeof import('../../api/market')>('../../api/market')
  return {
    ...actual,
    marketApi: {
      ...actual.marketApi,
      forkRule: vi.fn(),
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
    },
    ElMessageBox: {
      prompt: vi.fn(),
    },
  }
})

describe('useRuleFork', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('未登录时显示警告且不调用 API', async () => {
    const { forkRule } = useRuleFork()

    await forkRule({ id: 'rule-1', name: 'Demo' })

    expect(ElMessage.warning).toHaveBeenCalledWith('请先登录后再 Fork 规则')
    expect(ElMessageBox.prompt).not.toHaveBeenCalled()
    expect(marketApi.forkRule).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('登录后用户确认时调用 API 并跳转至创作中心', async () => {
    const userStore = useUserStore()
    userStore.applyUser({
      id: 'user-1',
      email: 'u@example.com',
      username: 'tester',
      avatar: '',
    })

    vi.mocked(ElMessageBox.prompt).mockResolvedValue({
      value: 'My Fork',
      action: 'confirm',
    } as never)
    vi.mocked(marketApi.forkRule).mockResolvedValue({
      success: true,
      data: { id: 'draft-42', status: 'draft', updatedAt: 123 },
    })

    const { forkRule } = useRuleFork()
    await forkRule({ id: 'rule-1', name: 'Demo' })

    expect(marketApi.forkRule).toHaveBeenCalledWith('rule-1', 'My Fork')
    expect(ElMessage.success).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/creation-center/draft-42')
  })

  it('登录但用户取消弹窗时不调用 API 也不跳转', async () => {
    const userStore = useUserStore()
    userStore.applyUser({
      id: 'user-1',
      email: 'u@example.com',
      username: 'tester',
      avatar: '',
    })

    vi.mocked(ElMessageBox.prompt).mockRejectedValue('cancel')

    const { forkRule } = useRuleFork()
    await forkRule({ id: 'rule-1', name: 'Demo' })

    expect(marketApi.forkRule).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(ElMessage.error).not.toHaveBeenCalled()
  })

  it('Fork API 失败时显示错误消息', async () => {
    const userStore = useUserStore()
    userStore.applyUser({
      id: 'user-1',
      email: 'u@example.com',
      username: 'tester',
      avatar: '',
    })

    vi.mocked(ElMessageBox.prompt).mockResolvedValue({
      value: 'My Fork',
      action: 'confirm',
    } as never)
    vi.mocked(marketApi.forkRule).mockResolvedValue({
      success: false,
      message: '服务器错误',
    })

    const { forkRule } = useRuleFork()
    await forkRule({ id: 'rule-1', name: 'Demo' })

    expect(ElMessage.error).toHaveBeenCalledWith('服务器错误')
    expect(push).not.toHaveBeenCalled()
  })
})
