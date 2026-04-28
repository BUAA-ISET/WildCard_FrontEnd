import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import About from '../About.vue'

describe('About.vue', () => {
  it('renders title ISET', () => {
    const wrapper = mount(About)
    expect(wrapper.find('h1').text()).toBe('ISET')
  })

  it('renders team description', () => {
    const wrapper = mount(About)
    expect(wrapper.text()).toContain('我们是 ISET 团队')
  })

  it('renders full team name meaning', () => {
    const wrapper = mount(About)
    expect(wrapper.text()).toContain('Improvised Software Engineering Team')
  })

  it('renders short team name', () => {
    const wrapper = mount(About)
    expect(wrapper.text()).toContain('临时软工团队')
  })

  it('renders member list', () => {
    const wrapper = mount(About)
    expect(wrapper.text()).toContain('团队成员如下')
  })

  it('renders all 7 members', () => {
    const wrapper = mount(About)
    const memberLinks = wrapper.findAll('.member')
    expect(memberLinks.length).toBe(7)
  })

  it('renders member names', () => {
    const wrapper = mount(About)
    expect(wrapper.text()).toContain('ywxy12138')
    expect(wrapper.text()).toContain('Likend')
    expect(wrapper.text()).toContain('cdostan')
    expect(wrapper.text()).toContain('LajiPZ')
    expect(wrapper.text()).toContain('Tanhhhhtjy')
    expect(wrapper.text()).toContain('er-huo')
    expect(wrapper.text()).toContain('hillarys14')
  })

  it('member links have github urls', () => {
    const wrapper = mount(About)
    const memberLinks = wrapper.findAll('.member')
    expect(memberLinks[0].attributes('href')).toBe('https://github.com/ywxy12138')
  })
})