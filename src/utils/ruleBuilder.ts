import type {
  CardsetDraft,
  ComponentTemplate,
  ExportedFlowNode,
  ExportedMethodMap,
  ExportedPropertyMap,
  ExportedRuleDesign,
  FlowGraphDraft,
  FlowScope,
  MethodDraft,
  MethodParameterDraft,
  PropertyDraft,
  RuleDesignDraft,
  RuleEdgeDraft,
  RuleNodeDraft,
  RuleObjectPool,
  RuleRuntimeObject,
  ValidationResult,
} from '../types/ruleBuilder'

export const CARD_INT_MIN = -5
export const CARD_INT_MAX = 20

export const componentTemplates: ComponentTemplate[] = [
  {
    title: '方法调用',
    componentType: 1,
    category: 'execute',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '对指定对象调用方法，可作为执行节点或返回值节点',
    defaultContent: () => ({ object: '', method: '', parameter: [], hasReturn: 0 }),
  },
  {
    title: '集合排序',
    componentType: 2,
    category: 'execute',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '按照属性优先级对集合排序',
    defaultContent: () => ({ properties: [{ name: '', order: 1 }] }),
  },
  {
    title: '赋值',
    componentType: 4,
    category: 'execute',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '把右值赋给左侧属性访问组件',
    defaultContent: () => ({ component: '', rvalue: '' }),
  },
  {
    title: '集合访问',
    componentType: 5,
    category: 'value',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '按下标访问集合中的对象',
    defaultContent: () => ({ selection: '', index: '' }),
  },
  {
    title: '属性访问',
    componentType: 6,
    category: 'value',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '从对象、组件或集合访问结果中选取属性',
    defaultContent: () => ({ operator: 0, ident: '', property: '' }),
  },
  {
    title: '集合大小',
    componentType: 7,
    category: 'value',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '返回集合内元素数量',
    defaultContent: () => ({ selection: '' }),
  },
  {
    title: '整数常量',
    componentType: 8,
    category: 'value',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '表示一个整数值',
    defaultContent: () => ({ value: 0 }),
  },
  {
    title: '枚举常量',
    componentType: 9,
    category: 'value',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '表示枚举属性的某个实际值',
    defaultContent: () => ({ value: 0 }),
  },
  {
    title: '算数运算',
    componentType: 10,
    category: 'operation',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '整数加减乘除模运算',
    defaultContent: () => ({ operator: 0, lval: '', rval: '' }),
  },
  {
    title: '集合逻辑',
    componentType: 11,
    category: 'logic',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '对集合执行存在或任意判断',
    defaultContent: () => ({ operator: 0, set: '', component: '' }),
  },
  {
    title: '双目逻辑',
    componentType: 12,
    category: 'logic',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '连接两个逻辑组件，执行与或运算',
    defaultContent: () => ({ operator: 0, lval: '', rval: '' }),
  },
  {
    title: '非逻辑',
    componentType: 13,
    category: 'logic',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '对逻辑组件取反',
    defaultContent: () => ({ component: '' }),
  },
  {
    title: '比较',
    componentType: 14,
    category: 'logic',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare', 'method'],
    description: '比较两个值组件或运算组件',
    defaultContent: () => ({ operator: 0, lval: '', rval: '' }),
  },
  {
    title: '牌型判断',
    componentType: 15,
    category: 'logic',
    scopes: ['match', 'settlement'],
    description: '判断传入牌组是否匹配指定牌型',
    defaultContent: () => ({ card_set: '', card_rule: '' }),
  },
  {
    title: '条件转移',
    componentType: 16,
    category: 'control',
    scopes: ['match', 'settlement', 'cardset', 'cardsetCompare'],
    description: '根据逻辑组件的结果走是或否两条分支',
    defaultContent: () => ({ condition: '' }),
  },
  {
    title: '结束对局',
    componentType: 18,
    category: 'control',
    scopes: ['match'],
    description: '进入结算流程',
    defaultContent: () => null,
  },
  {
    title: '洗牌',
    componentType: 19,
    category: 'action',
    scopes: ['match'],
    description: '随机排序牌桌卡牌池',
    defaultContent: () => ({}),
  },
  {
    title: '发牌',
    componentType: 20,
    category: 'action',
    scopes: ['match'],
    description: '按属性范围和数量给当前出牌者发牌',
    defaultContent: () => ({ prop_pair: [{ prop_name: '', lower_bound: 0, upper_bound: 13 }], count: 1 }),
  },
  {
    title: '出牌',
    componentType: 21,
    category: 'action',
    scopes: ['match'],
    description: '请求当前出牌者按牌型规则出牌',
    defaultContent: () => ({ timer: 30 }),
  },
  {
    title: '动作选择',
    componentType: 22,
    category: 'action',
    scopes: ['match'],
    description: '请求当前出牌者从枚举选项中选择动作',
    defaultContent: () => ({ options: [{ name: '选项', value: 0 }], timer: 30 }),
  },
  {
    title: '结算结束',
    componentType: 24,
    category: 'control',
    scopes: ['settlement'],
    description: '给当前玩家返回胜负结果',
    defaultContent: () => ({ result: 1 }),
  },
  {
    title: '方法返回',
    componentType: 26,
    category: 'control',
    scopes: ['method'],
    description: '结束方法流程并返回指定值',
    defaultContent: () => ({ return: '' }),
  },
  {
    title: '匹配返回',
    componentType: 28,
    category: 'control',
    scopes: ['cardset'],
    description: '返回是否匹配，以及匹配成功时的牌型属性',
    defaultContent: () => ({ result: 1, properties: {} }),
  },
  {
    title: '比较返回',
    componentType: 30,
    category: 'control',
    scopes: ['cardsetCompare'],
    description: '返回牌型 A 或牌型 B 的优先级更高',
    defaultContent: () => ({ result: 0 }),
  },
]

const fixedTemplates: Record<FlowScope, ComponentTemplate> = {
  match: {
    title: '对局开始',
    componentType: 17,
    category: 'control',
    scopes: ['match'],
    description: '固定起点，可访问牌桌单例',
    fixed: true,
    defaultContent: () => ({}),
  },
  settlement: {
    title: '结算开始',
    componentType: 23,
    category: 'control',
    scopes: ['settlement'],
    description: '固定起点，可代表对局中的任意玩家',
    fixed: true,
    defaultContent: () => ({}),
  },
  cardset: {
    title: '初始牌组',
    componentType: 27,
    category: 'control',
    scopes: ['cardset'],
    description: '固定起点，提供传入牌组属性',
    fixed: true,
    defaultContent: () => ({}),
  },
  cardsetCompare: {
    title: '比较开始',
    componentType: 29,
    category: 'control',
    scopes: ['cardsetCompare'],
    description: '固定起点，提供牌型 A 和牌型 B',
    fixed: true,
    defaultContent: () => ({}),
  },
  method: {
    title: '方法开始',
    componentType: 25,
    category: 'control',
    scopes: ['method'],
    description: '固定起点，可访问方法参数和当前对象',
    fixed: true,
    defaultContent: () => ({}),
  },
}

export const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const createProperty = (name = '新属性'): PropertyDraft => ({
  id: createId('property'),
  name,
  type: 'int',
  default: 0,
  config: [],
  lowerBound: 0,
  upperBound: 0,
})

export const createMethodParameter = (name = 'param'): MethodParameterDraft => ({
  id: createId('parameter'),
  name,
  type: 'int',
})

export const createMethod = (name = '新方法'): MethodDraft => ({
  id: createId('method'),
  name,
  parameters: [],
  returns: null,
  flow: createEmptyGraph('method'),
})

export const cloneContent = (content: Record<string, unknown> | null) => {
  if (content === null) {
    return null
  }

  return JSON.parse(JSON.stringify(content)) as Record<string, unknown>
}

export const createNodeFromTemplate = (
  template: ComponentTemplate,
  scope: FlowScope,
  x: number,
  y: number,
): RuleNodeDraft => ({
  id: createId(`node-${template.componentType}`),
  type: 'rule',
  position: { x, y },
  data: {
    title: template.title,
    componentType: template.componentType,
    category: template.category,
    scope,
    description: template.description,
    fixed: template.fixed,
    content: cloneContent(template.defaultContent()),
  },
})

export const createFixedStartNode = (scope: FlowScope): RuleNodeDraft => {
  return createNodeFromTemplate(fixedTemplates[scope], scope, 80, 180)
}

export const createEmptyGraph = (scope: FlowScope): FlowGraphDraft => ({
  nodes: [createFixedStartNode(scope)],
  edges: [],
})

export const createCardset = (name: string, index: number): CardsetDraft => ({
  id: String(index),
  name,
  properties: [createProperty('权重')],
  successors: [],
  buildFlow: createEmptyGraph('cardset'),
  compareFlow: createEmptyGraph('cardsetCompare'),
})
//卡组创建后flow里可以访问初始节点

export const createInitialDesign = (): RuleDesignDraft => ({
  info: {
    name: '未命名规则',
    playerCount: 4,
    description: '',
  },
  classes: {
    player: {
      name: 'player',
      displayName: '玩家',
      defaultProperties: [createProperty('手牌数')],
      userProperties: [],
      methods: [],
    },
    card: {
      name: 'card',
      displayName: '牌',
      defaultProperties: [
        {
          ...createProperty('点数'),
          type: 'enum',
          default: 1,
          config: [
            { id: createId('enum'), display: 'A', value: 1 },
            { id: createId('enum'), display: '2', value: 2 },
            { id: createId('enum'), display: '3', value: 3 },
          ],
        },
        {
          ...createProperty('花色'),
          type: 'enum',
          default: 0,
          config: [
            { id: createId('enum'), display: '黑桃', value: 0 },
            { id: createId('enum'), display: '红桃', value: 1 },
            { id: createId('enum'), display: '梅花', value: 2 },
            { id: createId('enum'), display: '方块', value: 3 },
          ],
        },
      ],
      userProperties: [],
      methods: [],
    },
    table: {
      name: 'table',
      displayName: '牌桌',
      defaultProperties: [
        { ...createProperty('卡牌池'), type: 'int' },
        { ...createProperty('玩家池'), type: 'int' },
        { ...createProperty('本轮应出牌者'), type: 'int' },
      ],
      userProperties: [],
      methods: [],
    },
  },
  cardsets: [createCardset('单张', 1)],
  matchFlow: createEmptyGraph('match'),
  endFlow: createEmptyGraph('settlement'),
})

const propertyToJson = (property: PropertyDraft): ExportedPropertyMap[string] => {
  const json: ExportedPropertyMap[string] = {
    type: property.type,
    default: property.default,
  }

  if (property.type === 'enum') {
    json.config = property.config || []
  }

  return json
}

const normalizeIntRange = (property: PropertyDraft) => {
  const lowerBound = Math.max(CARD_INT_MIN, Math.min(CARD_INT_MAX, property.lowerBound ?? property.default))
  const upperBound = Math.max(lowerBound, Math.min(CARD_INT_MAX, property.upperBound ?? property.default))
  return { lowerBound, upperBound }
}

const getDefaultPropertiesValue = (properties: PropertyDraft[]) => {
  return Object.fromEntries(properties.map(property => [property.name, property.default]))
}

const getPropertyPossibleValues = (property: PropertyDraft) => {
  if (property.type === 'enum') {
    const values = (property.config || []).map(option => option.value)
    return values.length > 0 ? values : [property.default]
  }

  const { lowerBound, upperBound } = normalizeIntRange(property)
  return Array.from({ length: upperBound - lowerBound + 1 }, (_, index) => lowerBound + index)
}

const buildCardProperties = (properties: PropertyDraft[], prefix: Record<string, unknown>, index: number): RuleRuntimeObject[] => {
  const currentProperty = properties[0]

  if (!currentProperty) {
    return [
      {
        id: `card_${index}`,
        name: `card_${index}`,
        className: 'card',
        properties: prefix,
      },
    ]
  }

  const restProperties = properties.slice(1)
  const values = getPropertyPossibleValues(currentProperty)
  const cards: RuleRuntimeObject[] = []

  values.forEach(value => {
    const nestedCards = buildCardProperties(
      restProperties,
      {
        ...prefix,
        [currentProperty.name]: value,
      },
      index + cards.length,
    )
    cards.push(...nestedCards)
  })

  return cards.map((card, offset) => ({
    ...card,
    id: `card_${index + offset}`,
    name: `card_${index + offset}`,
  }))
}

export const createRuleObjectPool = (design: RuleDesignDraft): RuleObjectPool => {
  const playerClass = design.classes.player
  const cardClass = design.classes.card
  const tableClass = design.classes.table
  const playerProperties = getDefaultPropertiesValue([
    ...(playerClass?.defaultProperties || []),
    ...(playerClass?.userProperties || []),
  ])
  const tableUserProperties = getDefaultPropertiesValue(tableClass?.userProperties || [])

  const players = Array.from({ length: design.info.playerCount }, (_, index) => ({
    id: `player_${index}`,
    name: `player_${index}`,
    className: 'player' as const,
    properties: { ...playerProperties },
  }))
  const cards = buildCardProperties(cardClass?.defaultProperties || [], {}, 0)
  const table: RuleRuntimeObject = {
    id: 'table_0',
    name: 'table_0',
    className: 'table',
    properties: {
      ...tableUserProperties,
      玩家池: players,
      卡牌池: cards,
      本轮应出牌者: players[0]?.id || '',
    },
  }

  return {
    players,
    cards,
    table,
  }
}

const propertyListToJson = (properties: PropertyDraft[]): ExportedPropertyMap => {
  return Object.fromEntries(properties.map(property => [property.name, propertyToJson(property)]))
}

const methodListToJson = (methods: MethodDraft[]): ExportedMethodMap => {
  return Object.fromEntries(
    methods.map(method => [
      method.name,
      {
        parameters: Object.fromEntries(
          method.parameters.map(parameter => [
            parameter.name,
            {
              type: parameter.type,
            },
          ]),
        ),
        returns: method.returns,
        flow: exportFlowGraph(method.flow),
      },
    ]),
  )
}

const getStartNode = (graph: FlowGraphDraft) => {
  return graph.nodes.find(node => node.data.fixed) || graph.nodes[0]
}

const getSortedNodes = (graph: FlowGraphDraft) => {
  const startNode = getStartNode(graph)
  const otherNodes = graph.nodes
    .filter(node => node.id !== startNode?.id)
    .sort((first, second) => first.position.x - second.position.x || first.position.y - second.position.y)

  return startNode ? [startNode, ...otherNodes] : otherNodes
}

const getOrdinalMap = (graph: FlowGraphDraft) => {
  const entries = getSortedNodes(graph).map((node, index) => [node.id, String(index + 1)])
  return Object.fromEntries(entries) as Record<string, string>
}

const getOutgoingEdges = (graph: FlowGraphDraft, nodeId: string) => {
  return graph.edges.filter(edge => edge.source === nodeId)
}
//寻找某一节点的出边

export const exportFlowGraph = (graph: FlowGraphDraft): Record<string, ExportedFlowNode> => {
  const ordinalMap = getOrdinalMap(graph)
  const result: Record<string, ExportedFlowNode> = {}

  getSortedNodes(graph).forEach(node => {
    const content = cloneContent(node.data.content)
    const outgoingEdges = getOutgoingEdges(graph, node.id)
    const firstTarget = outgoingEdges[0]?.target
    const nextOrdinal = firstTarget ? ordinalMap[firstTarget] : ''

    if (node.data.componentType === 16) {
      const trueTarget = outgoingEdges.find(edge => edge.sourceHandle === 'true')?.target
      const falseTarget = outgoingEdges.find(edge => edge.sourceHandle === 'false')?.target

      if (content) {
        content.next_true = trueTarget ? ordinalMap[trueTarget] : ''
        content.next_false = falseTarget ? ordinalMap[falseTarget] : ''
      }
    } else if (node.data.componentType === 20 && content) {
      const count = content.count
      delete content.count
      delete content.next

      result[ordinalMap[node.id]] = {
        type: node.data.componentType,
        content,
        count,
        next: nextOrdinal,
      }
      return
    } else if (content && firstTarget && shouldWriteNext(node.data.componentType)) {
      content.next = ordinalMap[firstTarget]
    }

    result[ordinalMap[node.id]] = {
      type: node.data.componentType,
      content,
    }
  })

  return result
}

const shouldWriteNext = (componentType: number) => {
  return ![5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 24, 26, 28, 30].includes(componentType)
}

export const exportRuleDesign = (design: RuleDesignDraft): ExportedRuleDesign => ({
  classes: Object.fromEntries(
    Object.entries(design.classes).map(([className, classDraft]) => [
      className,
      {
        default_properties: propertyListToJson(classDraft.defaultProperties),
        user_properties: propertyListToJson(classDraft.userProperties),
        methods: methodListToJson(classDraft.methods),
      },
    ]),
  ) as ExportedRuleDesign['classes'],
  cardsets: Object.fromEntries(
    design.cardsets.map(cardset => [
      cardset.id,
      {
        name: cardset.name,
        properties: propertyListToJson(cardset.properties),
        build_flow: exportFlowGraph(cardset.buildFlow),
        compare_flow: exportFlowGraph(cardset.compareFlow),
        successors: cardset.successors,
      },
    ]),
  ),
  match_flow: exportFlowGraph(design.matchFlow),
  end_flow: exportFlowGraph(design.endFlow),
})

const validateGraph = (graph: FlowGraphDraft, name: string): ValidationResult[] => {
  const results: ValidationResult[] = []
  const startNode = getStartNode(graph)

  if (!startNode) {
    results.push({ level: 'error', message: `${name} 缺少开始节点` })
    return results
  }

  graph.nodes.forEach(node => {
    const outgoingEdges = getOutgoingEdges(graph, node.id)

    if (node.data.componentType === 16) {
      const hasTrue = outgoingEdges.some(edge => edge.sourceHandle === 'true')
      const hasFalse = outgoingEdges.some(edge => edge.sourceHandle === 'false')

      if (!hasTrue || !hasFalse) {
        results.push({ level: 'warning', message: `${name} 的「${node.data.title}」建议连接是/否两条分支` })
      }
    }

    if (shouldWriteNext(node.data.componentType) && node.data.componentType !== 16 && outgoingEdges.length === 0) {
      results.push({ level: 'warning', message: `${name} 的「${node.data.title}」还没有后续节点` })
    }
  })

  return results
}

export const validateRuleDesign = (design: RuleDesignDraft): ValidationResult[] => {
  const results: ValidationResult[] = []

  if (!design.info.name.trim()) {
    results.push({ level: 'error', message: '规则名称不能为空' })
  }

  if (design.cardsets.length === 0) {
    results.push({ level: 'error', message: '至少需要一种牌型' })
  }

  results.push(...validateGraph(design.matchFlow, '对局流程'))
  results.push(...validateGraph(design.endFlow, '结算流程'))

  design.cardsets.forEach(cardset => {
    results.push(...validateGraph(cardset.buildFlow, `牌型「${cardset.name}」构建流程`))
    results.push(...validateGraph(cardset.compareFlow, `牌型「${cardset.name}」内部比较流程`))
  })

  Object.values(design.classes).forEach(classDraft => {
    classDraft.methods.forEach(method => {
      if (!method.name.trim()) {
        results.push({ level: 'error', message: `${classDraft.displayName} 中存在未命名方法` })
      }

      method.parameters.forEach(parameter => {
        if (!parameter.name.trim()) {
          results.push({ level: 'error', message: `方法「${method.name || '未命名方法'}」中存在未命名参数` })
        }
      })

      results.push(...validateGraph(method.flow, `${classDraft.displayName} 方法「${method.name}」流程`))
    })
  })

  return results
}

export const edgeHasSameSourceHandle = (edges: RuleEdgeDraft[], source: string, sourceHandle?: string | null) => {
  return edges.some(edge => edge.source === source && (edge.sourceHandle || null) === (sourceHandle || null))
}
