import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RoomCreate from '../RoomCreate.vue'

describe('RoomCreate', () => {
  it('renders the room create form', () => {
    const wrapper = mount(RoomCreate)

    wrapper.get('input[name="roomName"]')
    expect(wrapper.get('[data-testid="room-create-button"]').attributes('disabled')).toBeDefined()
  })

  it('enables the create button after entering a room name', async () => {
    const wrapper = mount(RoomCreate)
    const input = wrapper.get('input[name="roomName"]')

    await input.setValue('Test Room')

    expect(wrapper.get('[data-testid="room-create-button"]').attributes('disabled')).toBeUndefined()
  })
})
