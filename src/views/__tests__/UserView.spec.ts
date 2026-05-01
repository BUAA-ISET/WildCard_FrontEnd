import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../../stores/userStore'
import UserView from '../UserView.vue'

describe('UserView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

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

  it('shows user account container when logged in', () => {
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
})