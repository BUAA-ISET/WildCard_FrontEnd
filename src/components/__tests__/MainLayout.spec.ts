import { RouterLinkStub, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MainLayout from '../MainLayout.vue'

describe('MainLayout', () => {
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
        },
      },
    })

    expect(wrapper.text()).toContain('WildCard')
    expect(wrapper.text()).toContain('首页')
    expect(wrapper.text()).toContain('创作中心')
    expect(wrapper.text()).toContain('用户中心')
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
        },
      },
    })

    expect(wrapper.text()).toContain('Username')
    expect(wrapper.text()).toContain('Default Account')
  })
})
