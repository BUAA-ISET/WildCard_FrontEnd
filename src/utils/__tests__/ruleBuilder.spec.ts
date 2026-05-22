import { describe, expect, it } from 'vitest'
import type { RuleEdgeDraft } from '../../types/ruleBuilder'
import {
  componentTemplates,
  createCardset,
  createEmptyGraph,
  createInitialDesign,
  createNodeFromTemplate,
  createProperty,
  createRuleObjectPool,
  exportFlowGraph,
  exportRuleDesign,
  importRuleDesign,
  validateRuleDesign,
} from '../ruleBuilder'

function templateOf(componentType: number) {
  const template = componentTemplates.find(item => item.componentType === componentType)
  if (!template) {
    throw new Error(`missing template ${componentType}`)
  }
  return template
}

describe('ruleBuilder utilities', () => {
  it('creates a runtime object pool from player, card, and table defaults', () => {
    const design = createInitialDesign()
    design.info.playerCount = 2
    design.classes.player.userProperties = [{ ...createProperty('积分'), default: 5 }]
    design.classes.table.userProperties = [{ ...createProperty('回合'), default: 1 }]
    design.classes.card.defaultProperties = [
      {
        ...createProperty('点数'),
        type: 'enum',
        default: 1,
        config: [
          { display: 'A', value: 1 },
          { display: 'K', value: 13 },
        ],
      },
      {
        ...createProperty('花色'),
        type: 'enum',
        default: 0,
        config: [
          { display: '黑桃', value: 0 },
          { display: '红桃', value: 1 },
        ],
      },
    ]

    const pool = createRuleObjectPool(design)

    expect(pool.players).toHaveLength(2)
    expect(pool.players[0].properties).toMatchObject({ 手牌数: 0, 积分: 5 })
    expect(pool.cards).toHaveLength(4)
    expect(pool.cards.map(card => card.properties)).toContainEqual({ 点数: 1, 花色: 0 })
    expect(pool.cards.map(card => card.properties)).toContainEqual({ 点数: 13, 花色: 1 })
    expect(pool.table.properties).toMatchObject({ 回合: 1, 本轮应出牌者: 'player_0' })
    expect(pool.table.properties.玩家池).toEqual(pool.players)
    expect(pool.table.properties.卡牌池).toEqual(pool.cards)
  })

  it('exports flow ordinals, branch edges, and semantic input references', () => {
    const graph = createEmptyGraph('match')
    const start = graph.nodes[0]
    const value = createNodeFromTemplate(templateOf(8), 'match', 180, 120)
    const condition = createNodeFromTemplate(templateOf(16), 'match', 300, 120)
    const shuffle = createNodeFromTemplate(templateOf(19), 'match', 500, 80)
    const end = createNodeFromTemplate(templateOf(18), 'match', 700, 120)

    condition.data.content = { condition: value.id }
    graph.nodes.push(value, condition, shuffle, end)
    graph.edges = [
      { id: 'edge-start-condition', source: start.id, target: condition.id },
      { id: 'edge-value-condition', source: value.id, target: condition.id, targetHandle: 'condition' },
      { id: 'edge-condition-true', source: condition.id, target: shuffle.id, sourceHandle: 'true' },
      { id: 'edge-condition-false', source: condition.id, target: end.id, sourceHandle: 'false' },
      { id: 'edge-shuffle-end', source: shuffle.id, target: end.id },
    ] satisfies RuleEdgeDraft[]

    const exported = exportFlowGraph(graph)

    expect(exported['1']).toMatchObject({ type: 17, content: { next: '3' } })
    expect(exported['2']).toMatchObject({ type: 8, content: { value: 0 } })
    expect(exported['2'].content).not.toHaveProperty('next')
    expect(exported['3']).toMatchObject({
      type: 16,
      content: { condition: '2', next_true: '4', next_false: '5' },
    })
    expect(exported['4']).toMatchObject({ type: 19, content: { next: '5' } })
  })

  it('exports cardset comparison names and imports them back to draft ids', () => {
    const design = createInitialDesign()
    design.cardsets.push(createCardset('对子', 2))
    design.cardsetComparisons[0].cardsetA = '1'
    design.cardsetComparisons[0].cardsetB = '2'

    const exported = exportRuleDesign(design)

    expect(exported.cardset_comparisons['1']).toMatchObject({
      cardsetA: '单张',
      cardsetB: '对子',
    })

    const imported = importRuleDesign(exported)

    expect(imported.cardsetComparisons[0]).toMatchObject({
      cardsetA: '1',
      cardsetB: '2',
    })
  })

  it('reports strict runtime gaps for incomplete executable flows', () => {
    const design = createInitialDesign()
    design.info.name = '   '

    const messages = validateRuleDesign(design, { strictRuntime: true }).map(result => result.message)

    expect(messages).toContain('规则名称不能为空')
    expect(messages).toContain('对局流程需要连接到「结束对局」组件')
    expect(messages).toContain('结算流程需要包含「结算结束」组件')
    expect(messages).toContain('牌型「单张」构建流程需要包含「匹配返回」组件')
    expect(messages).toContain('牌型比较「牌型比较1」流程需要包含「比较返回」组件')
  })
})
