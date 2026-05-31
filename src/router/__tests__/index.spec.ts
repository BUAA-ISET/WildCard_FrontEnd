import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/userStore'

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

vi.mock('../../api/room', () => ({
  roomApi: {
    getCurrentRoom: vi.fn().mockResolvedValue({ success: false }),
  },
  getRoomEntryPath: () => '/',
}))

describe('router 守卫：/admin 命名空间', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
    // 重置路由模块缓存，确保每次拿到的是新建的 router 实例
    vi.resetModules()
  })

  it('未登录用户访问 /admin/rules-review 时被踢回 /user-info（更优先于 admin 检查）', async () => {
    const { default: router } = await import('../index')
    await router.push('/admin/rules-review')

    expect(router.currentRoute.value.path).toBe('/user-info')
  })

  it('登录但非 admin 时被拒绝并提示，重定向到首页', async () => {
    const { default: router } = await import('../index')
    const userStore = useUserStore()
    userStore.setUser({
      id: '1',
      username: 'normaluser',
      email: 'u@mail.com',
      avatar: '',
      role: 'user',
    })

    await router.push('/admin/rules-review')

    expect(router.currentRoute.value.path).toBe('/')
    expect(ElMessage.error).toHaveBeenCalledWith('需要管理员权限')
  })

  it('admin 用户可正常进入 /admin/rules-review', async () => {
    const { default: router } = await import('../index')
    const userStore = useUserStore()
    userStore.setUser({
      id: '1',
      username: 'adminuser',
      email: 'admin@mail.com',
      avatar: '',
      role: 'admin',
    })

    await router.push('/admin/rules-review')

    expect(router.currentRoute.value.path).toBe('/admin/rules-review')
    expect(ElMessage.error).not.toHaveBeenCalled()
  })

  it('未登录访问 /admin/rules-review/preview/:draftId 被踢回 /user-info', async () => {
    const { default: router } = await import('../index')
    await router.push('/admin/rules-review/preview/d-preview')

    expect(router.currentRoute.value.path).toBe('/user-info')
  })

  it('非 admin 访问 /admin/rules-review/preview/:draftId 被拦回首页', async () => {
    const { default: router } = await import('../index')
    const userStore = useUserStore()
    userStore.setUser({
      id: '1',
      username: 'normaluser',
      email: 'u@mail.com',
      avatar: '',
      role: 'user',
    })

    await router.push('/admin/rules-review/preview/d-preview')

    expect(router.currentRoute.value.path).toBe('/')
    expect(ElMessage.error).toHaveBeenCalledWith('需要管理员权限')
  })

  it('admin 可正常进入 /admin/rules-review/preview/:draftId', async () => {
    const { default: router } = await import('../index')
    const userStore = useUserStore()
    userStore.setUser({
      id: '1',
      username: 'adminuser',
      email: 'admin@mail.com',
      avatar: '',
      role: 'admin',
    })

    await router.push('/admin/rules-review/preview/d-preview')

    expect(router.currentRoute.value.path).toBe('/admin/rules-review/preview/d-preview')
    expect(router.currentRoute.value.params.draftId).toBe('d-preview')
    expect(ElMessage.error).not.toHaveBeenCalled()
  })
})
