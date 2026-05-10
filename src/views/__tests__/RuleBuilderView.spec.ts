import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RuleBuilderView from '../RuleBuilderView.vue'
import {
  componentTemplates,
  createEmptyGraph,
  createNodeFromTemplate,
  exportFlowGraph,
  importRuleDesign,
} from '../../utils/ruleBuilder'

vi.mock('../api/rule', () => ({
  ruleApi: {
    saveRuleDesign: vi.fn().mockResolvedValue({ success: true }),
    getRuleDesign: vi.fn().mockResolvedValue({ success: true, data: null }),
    getDraft: vi.fn().mockResolvedValue({ success: true, data: null }),
    createDraft: vi.fn().mockResolvedValue({ success: true, data: { id: 'draft-test', updatedAt: 0 } }),
    updateDraft: vi.fn().mockResolvedValue({ success: true, data: { id: 'draft-test', updatedAt: 0 } }),
    publishDraft: vi.fn().mockResolvedValue({ success: true, data: { ruleId: 'rule-test', version: 1 } }),
  },
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  }
})

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

describe('RuleBuilderView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('页面渲染', () => {
    it('渲染规则构建页面', () => {
      const wrapper = mount(RuleBuilderView, {
        global: {
          stubs: {
            'el-button': true,
            'el-dialog': true,
            'el-input': true,
            'rule-structure-panel': true,
            'rule-component-palette': true,
            'rule-flow-canvas': true,
            'rule-property-panel': true,
            'rule-json-preview': true,
          },
        },
      })
      expect(wrapper.find('.rule-builder-page').exists()).toBe(true)
    })

    it('渲染页面标题', () => {
      const wrapper = mount(RuleBuilderView, {
        global: {
          stubs: {
            'el-button': true,
            'el-dialog': true,
            'el-input': true,
            'rule-structure-panel': true,
            'rule-component-palette': true,
            'rule-flow-canvas': true,
            'rule-property-panel': true,
            'rule-json-preview': true,
          },
        },
      })
      expect(wrapper.find('.builder-header h1').text()).toBe('规则构建')
    })

    it('渲染子标题显示规则名称和玩家数', () => {
      const wrapper = mount(RuleBuilderView, {
        global: {
          stubs: {
            'el-button': true,
            'el-dialog': true,
            'el-input': true,
            'rule-structure-panel': true,
            'rule-component-palette': true,
            'rule-flow-canvas': true,
            'rule-property-panel': true,
            'rule-json-preview': true,
          },
        },
      })
      expect(wrapper.find('.builder-header p').text()).toContain('人')
    })
  })

  describe('工作区切换', () => {
    it('默认显示结构面板', () => {
      const wrapper = mount(RuleBuilderView, {
        global: {
          stubs: {
            'el-button': true,
            'el-dialog': true,
            'el-input': true,
            'rule-structure-panel': true,
            'rule-component-palette': true,
            'rule-flow-canvas': true,
            'rule-property-panel': true,
            'rule-json-preview': true,
          },
        },
      })
      expect(wrapper.find('.workspace-tab.active').text()).toBe('基础与牌型')
    })

    it('可以切换到方法流程工作区', async () => {
      const wrapper = mount(RuleBuilderView, {
        global: {
          stubs: {
            'el-button': true,
            'el-dialog': true,
            'el-input': true,
            'rule-structure-panel': true,
            'rule-component-palette': true,
            'rule-flow-canvas': true,
            'rule-property-panel': true,
            'rule-json-preview': true,
          },
        },
      })

      await wrapper.find('.workspace-tab:nth-child(2)').trigger('click')
      expect(wrapper.find('.workspace-tab.active').text()).toBe('方法流程')
    })
  })

  describe('操作按钮', () => {
    it('显示保存草稿按钮', () => {
      const wrapper = mount(RuleBuilderView, {
        global: {
          stubs: {
            'el-button': { template: '<button class="el-button"><slot /></button>' },
            'el-dialog': true,
            'el-input': true,
            'rule-structure-panel': true,
            'rule-component-palette': true,
            'rule-flow-canvas': true,
            'rule-property-panel': true,
            'rule-json-preview': true,
          },
        },
      })
      const buttons = wrapper.findAll('.header-actions .el-button')
      expect(buttons.length).toBeGreaterThan(0)
      const buttonTexts = buttons.map(btn => btn.text())
      expect(buttonTexts).toContain('保存草稿')
    })

    it('显示JSON预览切换按钮', () => {
      const wrapper = mount(RuleBuilderView, {
        global: {
          stubs: {
            'el-button': true,
            'el-dialog': true,
            'el-input': true,
            'rule-structure-panel': true,
            'rule-component-palette': true,
            'rule-flow-canvas': true,
            'rule-property-panel': true,
            'rule-json-preview': true,
          },
        },
      })
      expect(wrapper.find('.header-actions').exists()).toBe(true)
    })
  })

  describe('构建步骤展示', () => {
    it('在结构模式下显示构建步骤', () => {
      const wrapper = mount(RuleBuilderView, {
        global: {
          stubs: {
            'el-button': true,
            'el-dialog': true,
            'el-input': true,
            'rule-structure-panel': true,
            'rule-component-palette': true,
            'rule-flow-canvas': true,
            'rule-property-panel': true,
            'rule-json-preview': true,
          },
        },
      })
      expect(wrapper.find('.step-list').exists()).toBe(true)
      expect(wrapper.findAll('.step-item').length).toBe(4)
    })

    it('步骤包含正确的序号和标题', () => {
      const wrapper = mount(RuleBuilderView, {
        global: {
          stubs: {
            'el-button': true,
            'el-dialog': true,
            'el-input': true,
            'rule-structure-panel': true,
            'rule-component-palette': true,
            'rule-flow-canvas': true,
            'rule-property-panel': true,
            'rule-json-preview': true,
          },
        },
      })
      const steps = wrapper.findAll('.step-item')
      expect(steps[0].find('.step-index').text()).toBe('01')
      expect(steps[0].find('strong').text()).toBe('设定规则和固有类属性')
    })
  })

  describe('JSON 坐标恢复', () => {
    it('导出 JSON 时记录节点坐标，导入时按坐标恢复', () => {
      const graph = createEmptyGraph('match')
      graph.nodes[0].position = { x: 40, y: 60 }
      const shuffleTemplate = componentTemplates.find(template => template.componentType === 19)

      if (!shuffleTemplate) {
        throw new Error('缺少洗牌组件模板')
      }

      graph.nodes.push(createNodeFromTemplate(shuffleTemplate, 'match', 420, 260))

      const exportedFlow = exportFlowGraph(graph)
      expect(exportedFlow['1'].position).toEqual({ x: 40, y: 60 })
      expect(exportedFlow['2'].position).toEqual({ x: 420, y: 260 })

      const importedDesign = importRuleDesign({
        classes: {},
        cardsets: {},
        cardset_comparisons: {},
        match_flow: exportedFlow,
        end_flow: {},
      })

      expect(importedDesign.matchFlow.nodes[0].position).toEqual({ x: 40, y: 60 })
      expect(importedDesign.matchFlow.nodes[1].position).toEqual({ x: 420, y: 260 })
    })

    it('重新导入再导出时不改变原有布局坐标', () => {
      const sourceFlow = {
        '1': {
          type: 17,
          content: {},
          position: { x: -120.5, y: 88.25 },
        },
        '2': {
          type: 19,
          content: {},
          position: { x: 510, y: -64 },
        },
        '3': {
          type: 18,
          content: null,
          position: { x: 960.75, y: 315.5 },
        },
      }

      const importedDesign = importRuleDesign({
        classes: {},
        cardsets: {},
        cardset_comparisons: {},
        match_flow: sourceFlow,
        end_flow: {},
      })
      const exportedAgain = exportFlowGraph(importedDesign.matchFlow)

      expect(exportedAgain['1'].position).toEqual(sourceFlow['1'].position)
      expect(exportedAgain['2'].position).toEqual(sourceFlow['2'].position)
      expect(exportedAgain['3'].position).toEqual(sourceFlow['3'].position)
    })
  })
})
