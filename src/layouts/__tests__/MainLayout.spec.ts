import { RouterLinkStub, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../../stores/userStore'
import MainLayout from '../MainLayout.vue'

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRouter: () => ({
      resolve: (path: string) => ({ href: path }),
    }),
  }
})

describe('MainLayout', () => {
  beforeEach(() => {
    vi.stubGlobal('open', vi.fn())
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  describe('应用外壳导航', () => {
    it('登录后渲染应用外壳导航，并隐藏暂未开放入口', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@mail.com',
        avatar: '',
      })

      const wrapper = mount(MainLayout, {
        global: {
          stubs: {
            'router-link': RouterLinkStub,
            'router-view': true,
            'el-icon': true,
            House: true,
            EditPen: true,
            User: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
          },
        },
      })

      expect(wrapper.text()).toContain('WildCard')
      expect(wrapper.text()).toContain('首页')
      expect(wrapper.text()).toContain('创作中心')
      expect(wrapper.text()).toContain('用户中心')
      expect(wrapper.text()).not.toContain('规则市场')
      expect(wrapper.text()).not.toContain('卡牌样式')
      expect(wrapper.text()).not.toContain('对局界面')
    })
  })

  describe('未登录状态', () => {
    it('不显示头部和侧边栏，只保留页面内容', () => {
      const wrapper = mount(MainLayout, {
        global: {
          stubs: {
            'router-link': RouterLinkStub,
            'router-view': true,
            'el-icon': true,
            House: true,
            EditPen: true,
            User: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
          },
        },
      })

      expect(wrapper.find('.top-header').exists()).toBe(false)
      expect(wrapper.find('.sidebar').exists()).toBe(false)
      expect(wrapper.find('.main-content').exists()).toBe(true)
    })

    it('未登录时不显示默认用户摘要和头像', () => {
      const wrapper = mount(MainLayout, {
        global: {
          stubs: {
            'router-link': RouterLinkStub,
            'router-view': true,
            'el-icon': true,
            House: true,
            EditPen: true,
            User: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
          },
        },
      })

      expect(wrapper.text()).not.toContain('未登录')
      expect(wrapper.text()).not.toContain('not logged in')
      expect(wrapper.find('.avatar-circle').exists()).toBe(false)
    })
  })

  describe('已登录状态的用户展示', () => {
    it('登录后显示用户邮箱', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@mail.com',
        avatar: '',
      })

      const wrapper = mount(MainLayout, {
        global: {
          stubs: {
            'router-link': RouterLinkStub,
            'router-view': true,
            'el-icon': true,
            House: true,
            EditPen: true,
            User: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
          },
        },
      })

      expect(wrapper.find('.username').text()).toBe('testuser')
      expect(wrapper.find('.user-email').text()).toBe('test@mail.com')
    })

    it('登录后显示用户头像', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@mail.com',
        avatar: 'https://example.com/avatar.png',
      })

      const wrapper = mount(MainLayout, {
        global: {
          stubs: {
            'router-link': RouterLinkStub,
            'router-view': true,
            'el-icon': true,
            House: true,
            EditPen: true,
            User: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
          },
        },
      })

      const avatarImg = wrapper.find('.avatar-circle')
      expect(avatarImg.exists()).toBe(true)
    })

    it('退出登录后恢复默认显示', async () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 'test@mail.com',
        avatar: '',
      })

      const wrapper = mount(MainLayout, {
        global: {
          stubs: {
            'router-link': RouterLinkStub,
            'router-view': true,
            'el-icon': true,
            House: true,
            EditPen: true,
            User: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
          },
        },
      })

      expect(wrapper.find('.username').text()).toBe('testuser')

      userStore.setUser(null)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.sidebar').exists()).toBe(false)
      expect(wrapper.find('.username').exists()).toBe(false)
      expect(wrapper.find('.user-email').exists()).toBe(false)
    })
  })

  describe('用户展示框与登录状态同步', () => {
    it('用户信息更新后同步到导航栏', async () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'initialuser',
        email: 'initial@mail.com',
        avatar: '',
      })

      const wrapper = mount(MainLayout, {
        global: {
          stubs: {
            'router-link': RouterLinkStub,
            'router-view': true,
            'el-icon': true,
            House: true,
            EditPen: true,
            User: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
          },
        },
      })

      expect(wrapper.find('.username').text()).toBe('initialuser')

      userStore.setUser({
        id: '2',
        username: 'updateduser',
        email: 'updated@mail.com',
        avatar: '',
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.username').text()).toBe('updateduser')
      expect(wrapper.find('.user-email').text()).toBe('updated@mail.com')
    })
  })
})
