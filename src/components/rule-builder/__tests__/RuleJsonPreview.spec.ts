import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RuleJsonPreview from '../RuleJsonPreview.vue'

describe('RuleJsonPreview.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('渲染JSON预览面板', () => {
      const wrapper = mount(RuleJsonPreview, {
        props: {
          jsonText: '{"name": "test"}',
          validations: [],
        },
        global: {
          stubs: {
            'el-button': true,
          },
        },
      })
      expect(wrapper.find('.json-panel').exists()).toBe(true)
    })

    it('渲染面板标题', () => {
      const wrapper = mount(RuleJsonPreview, {
        props: {
          jsonText: '{"name": "test"}',
          validations: [],
        },
        global: {
          stubs: {
            'el-button': true,
          },
        },
      })
      expect(wrapper.find('.panel-header h2').text()).toBe('JSON 预览')
    })

    it('显示JSON文本', () => {
      const testJson = '{"name": "test-rule", "playerCount": 4}'
      const wrapper = mount(RuleJsonPreview, {
        props: {
          jsonText: testJson,
          validations: [],
        },
        global: {
          stubs: {
            'el-button': true,
          },
        },
      })
      expect(wrapper.find('.json-code').text()).toBe(testJson)
    })

    it('显示复制按钮', () => {
      const wrapper = mount(RuleJsonPreview, {
        props: {
          jsonText: '{"name": "test"}',
          validations: [],
        },
        global: {
          stubs: {
            'el-button': { template: '<button><slot /></button>' },
          },
        },
      })
      expect(wrapper.find('.panel-header button').exists()).toBe(true)
    })
  })

  describe('校验信息展示', () => {
    it('没有校验问题时显示成功消息', () => {
      const wrapper = mount(RuleJsonPreview, {
        props: {
          jsonText: '{"name": "test"}',
          validations: [],
        },
        global: {
          stubs: {
            'el-button': true,
          },
        },
      })
      expect(wrapper.find('.valid-item.success').text()).toBe('当前没有发现明显问题')
    })

    it('显示错误级别的校验信息', () => {
      const validations = [
        { level: 'error' as const, message: '缺少规则名称' },
      ]
      const wrapper = mount(RuleJsonPreview, {
        props: {
          jsonText: '{"name": ""}',
          validations,
        },
        global: {
          stubs: {
            'el-button': true,
          },
        },
      })
      expect(wrapper.findAll('.valid-item').length).toBe(1)
      expect(wrapper.find('.valid-item.error').text()).toBe('缺少规则名称')
    })

    it('显示警告级别的校验信息', () => {
      const validations = [
        { level: 'warning' as const, message: '建议添加规则描述' },
      ]
      const wrapper = mount(RuleJsonPreview, {
        props: {
          jsonText: '{"name": "test"}',
          validations,
        },
        global: {
          stubs: {
            'el-button': true,
          },
        },
      })
      expect(wrapper.find('.valid-item.warning').text()).toBe('建议添加规则描述')
    })

    it('显示多个校验信息', () => {
      const validations = [
        { level: 'error' as const, message: '错误1' },
        { level: 'warning' as const, message: '警告1' },
      ]
      const wrapper = mount(RuleJsonPreview, {
        props: {
          jsonText: '{"name": "test"}',
          validations,
        },
        global: {
          stubs: {
            'el-button': true,
          },
        },
      })
      expect(wrapper.findAll('.valid-item').length).toBe(2)
    })
  })

  describe('交互测试', () => {
    it('点击复制按钮触发copy-json事件', async () => {
      const wrapper = mount(RuleJsonPreview, {
        props: {
          jsonText: '{"name": "test"}',
          validations: [],
        },
        global: {
          stubs: {
            'el-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          },
        },
      })

      await wrapper.find('.panel-header button').trigger('click')
      expect(wrapper.emitted('copy-json')).toBeTruthy()
    })
  })
})
