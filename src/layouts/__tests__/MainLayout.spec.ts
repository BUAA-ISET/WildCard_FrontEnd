import { RouterLinkStub, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../../stores/userStore'
import MainLayout from '../MainLayout.vue'

const pushMock = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRouter: () => ({
      resolve: (path: string) => ({ href: path }),
      push: pushMock,
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
            Clock: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
            Document: true,
          },
        },
      })

      expect(wrapper.text()).toContain('WildCard')
      expect(wrapper.text()).toContain('首页')
      expect(wrapper.text()).toContain('创作中心')
      expect(wrapper.text()).toContain('历史对局')
      expect(wrapper.text()).toContain('用户中心')
      expect(wrapper.text()).toContain('规则市场')
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
            Clock: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
            Document: true,
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
            Clock: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
            Document: true,
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
            Clock: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
            Document: true,
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
            Clock: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
            Document: true,
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
            Clock: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
            Document: true,
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
            Clock: true,
            Shop: true,
            Brush: true,
            VideoPlay: true,
            Document: true,
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

  describe('审核员入口可见性', () => {
    const sharedStubs = {
      'router-link': RouterLinkStub,
      'router-view': true,
      'el-icon': true,
      House: true,
      EditPen: true,
      User: true,
      Shop: true,
      Brush: true,
      VideoPlay: true,
      Document: true,
    }

    it('role=admin 时显示规则审核入口并指向 /admin/rules-review', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'adminuser',
        email: 'admin@mail.com',
        avatar: '',
        role: 'admin',
      })

      const wrapper = mount(MainLayout, { global: { stubs: sharedStubs } })

      expect(wrapper.text()).toContain('规则审核')
      const adminLink = wrapper.findAllComponents(RouterLinkStub).find(link => link.props('to') === '/admin/rules-review')
      expect(adminLink).toBeTruthy()
    })

    it('role=user 时不显示规则审核入口', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'normaluser',
        email: 'user@mail.com',
        avatar: '',
        role: 'user',
      })

      const wrapper = mount(MainLayout, { global: { stubs: sharedStubs } })

      expect(wrapper.text()).not.toContain('规则审核')
      const adminLink = wrapper.findAllComponents(RouterLinkStub).find(link => link.props('to') === '/admin/rules-review')
      expect(adminLink).toBeFalsy()
    })

    it('默认 role 缺省视为普通用户，不显示规则审核入口', () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'noroleuser',
        email: 'user@mail.com',
        avatar: '',
      })

      const wrapper = mount(MainLayout, { global: { stubs: sharedStubs } })

      expect(wrapper.text()).not.toContain('规则审核')
    })
  })

  describe('顶栏链接跳转', () => {
    // 历史 bug：早先 handleTeamIntro/Contact/Help 用 window.open 新标签打开，
    // 新 tab sessionStorage 是空的，token 拿不到被守卫踢回登录页。fix #154
    // 改成 router.push 当前 tab 跳转。这里固化"3 个按钮 = 3 个 router.push"行为，
    // 防止有人再改回 window.open。
    it('登录后点击 团队介绍 / 联系我们 / 帮助中心 走 router.push 到对应路径', async () => {
      const userStore = useUserStore()
      userStore.setUser({
        id: '1',
        username: 'testuser',
        email: 't@m.com',
        avatar: '',
      })
      pushMock.mockClear()

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
            Document: true,
          },
        },
      })

      const items = wrapper.findAll('.top-nav-item')
      const map: Record<string, string> = {
        团队介绍: '/teaminfo/about',
        联系我们: '/teaminfo/contact',
        帮助中心: '/teaminfo/help',
      }
      for (const item of items) {
        const text = item.text()
        const expectedPath = map[text]
        if (!expectedPath) continue
        await item.trigger('click')
        expect(pushMock).toHaveBeenLastCalledWith(expectedPath)
      }
      expect(pushMock).toHaveBeenCalledTimes(Object.keys(map).length)
    })
  })
})
