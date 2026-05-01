import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserStore } from '../userStore'
import { userApi } from '../../api/user'

vi.mock('../../api/user', () => ({
  userApi: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

describe('userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('logs in successfully with valid credentials', async () => {
    vi.mocked(userApi.login).mockResolvedValue({
      success: true,
      data: {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      },
    })

    const store = useUserStore()

    const result = await store.login({
      email: '  test@test.com  ',
      password: '  password  ',
    })

    expect(result.success).toBe(true)
    expect(store.isLoggedIn).toBe(true)
    expect(store.email).toBe('test@test.com')
  })

  it('rejects empty credentials without mutating state', async () => {
    const store = useUserStore()

    const result = await store.login({
      email: '   ',
      password: '   ',
    })

    expect(result.success).toBe(false)
    expect(store.isLoggedIn).toBe(false)
    expect(store.email).toBe('')
  })

  it('resets state on logout', async () => {
    vi.mocked(userApi.login).mockResolvedValue({
      success: true,
      data: {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      },
    })
    vi.mocked(userApi.logout).mockResolvedValue({ success: true })

    const store = useUserStore()

    await store.login({
      email: 'test@test.com',
      password: 'password',
    })
    await store.logout()

    expect(store.isLoggedIn).toBe(false)
    expect(store.email).toBe('')
  })
})
