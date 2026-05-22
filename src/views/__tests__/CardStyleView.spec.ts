import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import CardStyleView from '../CardStyleView.vue'

const storageKey = 'wildcard-card-style'

describe('CardStyleView', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the default card style when no saved style exists', () => {
    const wrapper = mount(CardStyleView)
    const selects = wrapper.findAll('select')
    const inputs = wrapper.findAll('input')

    expect(selects[0].element.value).toBe('Arial, sans-serif')
    expect(selects[1].element.value).toBe('classic')
    expect(inputs[0].element.value).toBe('')
    expect(inputs[1].element.value).toBe('')
    expect(wrapper.find('.front-card').classes()).toContain('theme-classic')
  })

  it('loads a saved card style from localStorage', () => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      fontFamily: `'Courier New', monospace`,
      theme: 'green',
      frontImage: 'https://example.test/front.png',
      backImage: 'https://example.test/back.png',
    }))

    const wrapper = mount(CardStyleView)
    const selects = wrapper.findAll('select')
    const inputs = wrapper.findAll('input')

    expect(selects[0].element.value).toBe(`'Courier New', monospace`)
    expect(selects[1].element.value).toBe('green')
    expect(inputs[0].element.value).toBe('https://example.test/front.png')
    expect(inputs[1].element.value).toBe('https://example.test/back.png')
    expect(wrapper.find('.front-card').classes()).toContain('theme-green')
  })

  it('persists changed controls to localStorage', async () => {
    const wrapper = mount(CardStyleView)
    const selects = wrapper.findAll('select')
    const inputs = wrapper.findAll('input')

    await selects[0].setValue(`'Times New Roman', serif`)
    await selects[1].setValue('soft')
    await inputs[0].setValue('https://example.test/front.jpg')
    await inputs[1].setValue('https://example.test/back.jpg')

    expect(JSON.parse(window.localStorage.getItem(storageKey) || '{}')).toEqual({
      fontFamily: `'Times New Roman', serif`,
      theme: 'soft',
      frontImage: 'https://example.test/front.jpg',
      backImage: 'https://example.test/back.jpg',
    })
  })

  it('resets the saved style back to defaults', async () => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      fontFamily: `'Courier New', monospace`,
      theme: 'green',
      frontImage: 'https://example.test/front.png',
      backImage: 'https://example.test/back.png',
    }))

    const wrapper = mount(CardStyleView)

    await wrapper.find('.plain-btn').trigger('click')

    expect(JSON.parse(window.localStorage.getItem(storageKey) || '{}')).toEqual({
      fontFamily: 'Arial, sans-serif',
      theme: 'classic',
      frontImage: '',
      backImage: '',
    })
    expect(wrapper.findAll('select')[1].element.value).toBe('classic')
    expect(wrapper.findAll('input')[0].element.value).toBe('')
  })
})
