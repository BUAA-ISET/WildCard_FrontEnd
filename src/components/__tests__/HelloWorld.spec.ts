import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HelloWorld from '../HelloWorld.vue'

describe('HelloWorld', () => {
  it('renders the starter heading', () => {
    const wrapper = mount(HelloWorld)

    expect(wrapper.get('h1').text()).toBe('Get started')
  })

  it('increments the counter when clicked', async () => {
    const wrapper = mount(HelloWorld)
    const button = wrapper.get('button.counter')

    expect(button.text()).toContain('0')

    await button.trigger('click')

    expect(button.text()).toContain('1')
  })
})
