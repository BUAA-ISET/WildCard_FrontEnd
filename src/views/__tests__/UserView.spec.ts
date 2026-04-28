import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UserView from '../UserView.vue'

describe('UserView.vue', () => {
  it('renders user page wrapper', () => {
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

  it('shows auth container when not logged in', () => {
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

  it('toggles to logged in state', async () => {
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
    await wrapper.find('.toggle-btn').trigger('click')
    expect(wrapper.find('.user-account-container').exists()).toBe(true)
  })
})