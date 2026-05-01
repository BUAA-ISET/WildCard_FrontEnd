import { RouterLinkStub, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
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
    setActivePinia(createPinia())
  })

  it('renders the application shell navigation', () => {
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
    expect(wrapper.text()).toContain('规则市场')
  })

  it('shows the default user summary', () => {
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

    expect(wrapper.text()).toContain('未登录')
    expect(wrapper.text()).toContain('not logged in')
  })
})
