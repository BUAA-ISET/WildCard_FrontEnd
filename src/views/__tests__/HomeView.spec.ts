import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HomeView from '../HomeView.vue'

describe('HomeView.vue', () => {
  it('renders logo', () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          'el-button': true,
        },
      },
    })
    expect(wrapper.find('.main-logo').exists()).toBe(true)
  })

  it('renders subtitle', () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          'el-button': true,
        },
      },
    })
    expect(wrapper.text()).toContain('Make your own rule!')
  })

  it('renders description', () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          'el-button': true,
        },
      },
    })
    expect(wrapper.text()).toContain('Unleash your imagination')
  })
})