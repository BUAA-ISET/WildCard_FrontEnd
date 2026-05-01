import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RuleStructurePanel from '../RuleStructurePanel.vue'
import { createInitialDesign, createRuleObjectPool } from '../../utils/ruleBuilder'

const mockDesign = createInitialDesign()
const mockObjectPool = createRuleObjectPool(mockDesign)

describe('RuleStructurePanel.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础信息部分', () => {
    it('渲染面板标题', () => {
      const wrapper = mount(RuleStructurePanel, {
        props: {
          design: mockDesign,
          activeCardsetId: mockDesign.cardsets[0].id,
          activeMethodId: null,
          objectPool: mockObjectPool,
        },
        global: {
          stubs: {
            'el-form': true,
            'el-form-item': true,
            'el-input': true,
            'el-input-number': true,
            'el-textarea': true,
            'el-button': true,
            'el-checkbox': true,
            'el-checkbox-group': true,
            'el-select': true,
            'el-option': true,
            'property-list-editor': true,
          },
        },
      })
      expect(wrapper.find('.panel-header h2').text()).toBe('规则结构')
    })

    it('显示基础信息表单', () => {
      const wrapper = mount(RuleStructurePanel, {
        props: {
          design: mockDesign,
          activeCardsetId: mockDesign.cardsets[0].id,
          activeMethodId: null,
          objectPool: mockObjectPool,
        },
        global: {
          stubs: {
            'el-form': true,
            'el-form-item': true,
            'el-input': true,
            'el-input-number': true,
            'el-textarea': true,
            'el-button': true,
            'el-checkbox': true,
            'el-checkbox-group': true,
            'el-select': true,
            'el-option': true,
            'property-list-editor': true,
          },
        },
      })
      expect(wrapper.find('.basic-section').exists()).toBe(true)
      expect(wrapper.text()).toContain('基础信息')
    })

    it('显示对象摘要（玩家、牌、牌桌数量）', () => {
      const wrapper = mount(RuleStructurePanel, {
        props: {
          design: mockDesign,
          activeCardsetId: mockDesign.cardsets[0].id,
          activeMethodId: null,
          objectPool: mockObjectPool,
        },
        global: {
          stubs: {
            'el-form': true,
            'el-form-item': true,
            'el-input': true,
            'el-input-number': true,
            'el-textarea': true,
            'el-button': true,
            'el-checkbox': true,
            'el-checkbox-group': true,
            'el-select': true,
            'el-option': true,
            'property-list-editor': true,
          },
        },
      })
      expect(wrapper.find('.object-summary').exists()).toBe(true)
      expect(wrapper.text()).toContain('玩家对象')
      expect(wrapper.text()).toContain('牌对象')
      expect(wrapper.text()).toContain('牌桌对象')
    })
  })

  describe('牌型列表', () => {
    it('渲染牌型列表', () => {
      const wrapper = mount(RuleStructurePanel, {
        props: {
          design: mockDesign,
          activeCardsetId: mockDesign.cardsets[0].id,
          activeMethodId: null,
          objectPool: mockObjectPool,
        },
        global: {
          stubs: {
            'el-form': true,
            'el-form-item': true,
            'el-input': true,
            'el-input-number': true,
            'el-textarea': true,
            'el-button': true,
            'el-checkbox': true,
            'el-checkbox-group': true,
            'el-select': true,
            'el-option': true,
            'property-list-editor': true,
          },
        },
      })
      expect(wrapper.find('.cardset-list').exists()).toBe(true)
      expect(wrapper.findAll('.cardset-button').length).toBe(mockDesign.cardsets.length)
    })

    it('渲染新增和删除牌型按钮', () => {
      const wrapper = mount(RuleStructurePanel, {
        props: {
          design: mockDesign,
          activeCardsetId: mockDesign.cardsets[0].id,
          activeMethodId: null,
          objectPool: mockObjectPool,
        },
        global: {
          stubs: {
            'el-form': true,
            'el-form-item': true,
            'el-input': true,
            'el-input-number': true,
            'el-textarea': true,
            'el-button': true,
            'el-checkbox': true,
            'el-checkbox-group': true,
            'el-select': true,
            'el-option': true,
            'property-list-editor': true,
          },
        },
      })
      expect(wrapper.find('.cardset-actions').exists()).toBe(true)
      expect(wrapper.text()).toContain('新增牌型')
      expect(wrapper.text()).toContain('删除当前')
    })

    it('点击新增牌型按钮触发事件', async () => {
      const wrapper = mount(RuleStructurePanel, {
        props: {
          design: mockDesign,
          activeCardsetId: mockDesign.cardsets[0].id,
          activeMethodId: null,
          objectPool: mockObjectPool,
        },
        global: {
          stubs: {
            'el-form': true,
            'el-form-item': true,
            'el-input': true,
            'el-input-number': true,
            'el-textarea': true,
            'el-button': true,
            'el-checkbox': true,
            'el-checkbox-group': true,
            'el-select': true,
            'el-option': true,
            'property-list-editor': true,
          },
        },
      })

      await wrapper.find('.cardset-actions .el-button').trigger('click')
      expect(wrapper.emitted('add-cardset')).toBeTruthy()
    })
  })

  describe('类属性和方法', () => {
    it('渲染类列表', () => {
      const wrapper = mount(RuleStructurePanel, {
        props: {
          design: mockDesign,
          activeCardsetId: mockDesign.cardsets[0].id,
          activeMethodId: null,
          objectPool: mockObjectPool,
        },
        global: {
          stubs: {
            'el-form': true,
            'el-form-item': true,
            'el-input': true,
            'el-input-number': true,
            'el-textarea': true,
            'el-button': true,
            'el-checkbox': true,
            'el-checkbox-group': true,
            'el-select': true,
            'el-option': true,
            'property-list-editor': true,
          },
        },
      })
      expect(wrapper.findAll('.class-section').length).toBeGreaterThan(0)
    })

    it('显示暂无方法文本', () => {
      const wrapper = mount(RuleStructurePanel, {
        props: {
          design: mockDesign,
          activeCardsetId: mockDesign.cardsets[0].id,
          activeMethodId: null,
          objectPool: mockObjectPool,
        },
        global: {
          stubs: {
            'el-form': true,
            'el-form-item': true,
            'el-input': true,
            'el-input-number': true,
            'el-textarea': true,
            'el-button': true,
            'el-checkbox': true,
            'el-checkbox-group': true,
            'el-select': true,
            'el-option': true,
            'property-list-editor': true,
          },
        },
      })
      expect(wrapper.find('.empty-text').exists()).toBe(true)
    })
  })
})
