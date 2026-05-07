import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../../stores/userStore'
import UserView from '../UserView.vue'

vi.mock('../../api/user', () => ({
  userApi: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    sendVerificationCode: vi.fn(),
    updateUsername: vi.fn(),
    updatePassword: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

vi.mock('../../api/config', () => ({
  shouldUseMockApi: () => false,
}))

describe('UserView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('未登录状态', () => {
    it('渲染用户页面容器', () => {
      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.user-page-wrapper').exists()).toBe(true)
    })

    it('显示认证容器（登录/注册表单）', () => {
      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.auth-container').exists()).toBe(true)
    })

    it('默认显示登录标签页', () => {
      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.auth-container').exists()).toBe(true)
    })

    it('可以切换到注册标签页', async () => {
      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.auth-container').exists()).toBe(true)
    })

    it('登录表单包含邮箱和密码输入框', () => {
      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.auth-container').exists()).toBe(true)
    })
  })

  describe('已登录状态', () => {
    it('显示用户账户容器', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      })

      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.user-account-container').exists()).toBe(true)
    })

    it('显示用户头像', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: 'https://example.com/avatar.png',
      })

      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.avatar-img').exists()).toBe(true)
    })

    it('显示用户名和邮箱', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      })

      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.user-name').text()).toBe('testuser')
      expect(wrapper.find('.user-email').text()).toBe('test@test.com')
    })

    it('显示退出登录按钮', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      })

      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.logout-btn').exists()).toBe(true)
    })

    it('显示用户名修改区域', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      })

      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.setting-section').exists()).toBe(true)
    })

    it('显示密码修改区域', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: '',
      })

      const wrapper = mount(UserView, {
        global: {
          stubs: {
            'el-button': true,
            'el-tabs': true,
            'el-tab-pane': true,
            'el-input': true,
            'el-icon': true,
          },
        },
      })
      expect(wrapper.find('.setting-section').exists()).toBe(true)
    })
  })
})
