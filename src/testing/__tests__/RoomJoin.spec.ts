import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RoomJoin from '../RoomJoin.vue'

describe('RoomJoin', () => {
  it('renders the room join form', () => {
    const wrapper = mount(RoomJoin)

    wrapper.get('input[name="roomCode"]')
    expect(wrapper.get('[data-testid="room-join-button"]').attributes('disabled')).toBeDefined()
  })

  it('enables the join button for a valid room code', async () => {
    const wrapper = mount(RoomJoin)
    const input = wrapper.get('input[name="roomCode"]')

    await input.setValue('ABCD')

    expect(wrapper.get('[data-testid="room-join-button"]').attributes('disabled')).toBeUndefined()
  })
})
