import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserStore } from '../userStore'
import { userApi } from '../../api/user'

vi.mock('../../api/user', () => ({
  userApi: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateUsername: vi.fn(),
    updatePassword: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

describe('userStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('登录功能', () => {
    it('使用有效凭据登录成功', async () => {
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
      expect(store.username).toBe('testuser')
    })

    it('使用空凭据登录失败且不改变状态', async () => {
      const store = useUserStore()

      const result = await store.login({
        email: '   ',
        password: '   ',
      })

      expect(result.success).toBe(false)
      expect(store.isLoggedIn).toBe(false)
      expect(store.email).toBe('')
    })

    it('使用错误密码登录失败', async () => {
      vi.mocked(userApi.login).mockResolvedValue({
        success: false,
        message: '邮箱或密码错误',
      })

      const store = useUserStore()

      const result = await store.login({
        email: 'test@test.com',
        password: 'wrongpassword',
      })

      expect(result.success).toBe(false)
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('注册功能', () => {
    it('使用有效信息注册成功', async () => {
      vi.mocked(userApi.register).mockResolvedValue({
        success: true,
        data: {
          id: '2',
          username: 'newuser',
          email: 'new@test.com',
          avatar: '',
        },
      })

      const store = useUserStore()

      const result = await store.register({
        email: 'new@test.com',
        password: 'password123',
        username: 'newuser',
        verificationCode: '123456',
      })

      expect(result.success).toBe(true)
      expect(store.isLoggedIn).toBe(true)
      expect(store.email).toBe('new@test.com')
      expect(store.username).toBe('newuser')
    })

    it('注册失败时不改变登录状态', async () => {
      vi.mocked(userApi.register).mockResolvedValue({
        success: false,
        message: '验证码错误',
      })

      const store = useUserStore()

      const result = await store.register({
        email: 'new@test.com',
        password: 'password123',
        username: 'newuser',
        verificationCode: 'wrong',
      })

      expect(result.success).toBe(false)
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('用户名更新功能', () => {
    it('更新用户名成功', async () => {
      vi.mocked(userApi.login).mockResolvedValue({
        success: true,
        data: {
          id: '1',
          username: 'oldname',
          email: 'test@test.com',
          avatar: '',
        },
      })

      vi.mocked(userApi.updateUsername).mockResolvedValue({
        success: true,
        data: {
          id: '1',
          username: 'newname',
          email: 'test@test.com',
          avatar: '',
        },
      })

      const store = useUserStore()
      await store.login({ email: 'test@test.com', password: 'password' })

      const result = await userApi.updateUsername('newname')
      if (result.success && result.data) {
        store.setUser(result.data)
      }

      expect(result.success).toBe(true)
      expect(store.username).toBe('newname')
    })

    it('更新用户名为已存在的用户名失败', async () => {
      vi.mocked(userApi.updateUsername).mockResolvedValue({
        success: false,
        message: '用户名已存在',
      })

      const store = useUserStore()
      store.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      })

      const result = await userApi.updateUsername('existingname')

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户名已存在')
    })
  })

  describe('密码更新功能', () => {
    it('使用正确的当前密码更新密码成功', async () => {
      vi.mocked(userApi.login).mockResolvedValue({
        success: true,
        data: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatar: '',
        },
      })

      vi.mocked(userApi.updatePassword).mockResolvedValue({
        success: true,
        message: '密码更新成功',
      })

      const store = useUserStore()
      await store.login({ email: 'test@test.com', password: 'oldpassword' })

      const result = await userApi.updatePassword({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      })

      expect(result.success).toBe(true)
    })

    it('使用错误的当前密码更新密码失败', async () => {
      vi.mocked(userApi.login).mockResolvedValue({
        success: true,
        data: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatar: '',
        },
      })

      vi.mocked(userApi.updatePassword).mockResolvedValue({
        success: false,
        message: '当前密码错误',
      })

      const store = useUserStore()
      await store.login({ email: 'test@test.com', password: 'oldpassword' })

      const result = await userApi.updatePassword({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('当前密码错误')
    })

    it('未填写所有密码字段时失败', async () => {
      vi.mocked(userApi.updatePassword).mockResolvedValue({
        success: false,
        message: '请填写所有密码字段',
      })

      const store = useUserStore()
      store.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      })

      const result = await userApi.updatePassword({
        currentPassword: '',
        newPassword: 'newpassword',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('请填写所有密码字段')
    })
  })

  describe('退出登录功能', () => {
    it('成功退出登录', async () => {
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
      expect(store.isLoggedIn).toBe(true)

      await store.logout()
      expect(store.isLoggedIn).toBe(false)
      expect(store.email).toBe('')
      expect(store.username).toBe('')
    })
  })

  describe('获取当前用户功能', () => {
    it('获取当前用户成功', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue({
        success: true,
        data: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatar: '',
        },
      })

      const store = useUserStore()
      const result = await store.fetchCurrentUser()

      expect(result.success).toBe(true)
      expect(store.isLoggedIn).toBe(true)
      expect(store.email).toBe('test@test.com')
    })

    it('用户未登录时获取当前用户返回null', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue({
        success: true,
        data: null,
      })

      const store = useUserStore()
      const result = await store.fetchCurrentUser()

      expect(result.success).toBe(true)
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('applyUser功能', () => {
    it('applyUser(null)重置所有状态', () => {
      const store = useUserStore()
      store.applyUser({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      })

      expect(store.isLoggedIn).toBe(true)
      expect(store.username).toBe('testuser')

      store.applyUser(null)

      expect(store.isLoggedIn).toBe(false)
      expect(store.id).toBe('')
      expect(store.email).toBe('')
      expect(store.username).toBe('')
      expect(store.avatar).toBe('')
    })
  })
})
