export type DataType = 'int' | 'enum'

export type FlowScope = 'match' | 'settlement' | 'cardset' | 'cardsetCompare' | 'method'

export type NodeCategory = 'control' | 'action' | 'execute' | 'value' | 'logic' | 'operation'

export interface EnumOptionDraft {
  id?: string
  display: string
  value: number
}

export interface PropertyDraft {
  id: string
  name: string
  type: DataType
  default: number
  config?: EnumOptionDraft[]
  lowerBound?: number
  upperBound?: number
}

export interface RuleInfoDraft {
  name: string
  playerCount: number
  description: string
}

export interface RuleClassDraft {
  name: string
  displayName: string
  defaultProperties: PropertyDraft[]
  userProperties: PropertyDraft[]
  methods: MethodDraft[]
}

export interface MethodParameterDraft {
  id: string
  name: string
  type: DataType
}

export interface MethodDraft {
  id: string
  name: string
  parameters: MethodParameterDraft[]
  returns: DataType | null
  flow: FlowGraphDraft
}

export interface CardsetDraft {
  id: string
  name: string
  properties: PropertyDraft[]
  successors: string[]
  buildFlow: FlowGraphDraft
  compareFlow: FlowGraphDraft
}

export interface CardsetComparisonDraft {
  id: string
  name: string
  cardsetA: string
  cardsetB: string
  compareFlow: FlowGraphDraft
}

export interface FlowGraphDraft {
  nodes: RuleNodeDraft[]
  edges: RuleEdgeDraft[]
}

export interface RuleNodeDraft {
  id: string
  type: 'rule'
  position: {
    x: number
    y: number
  }
  data: RuleNodeData
}

export interface RuleEdgeDraft {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  label?: string
}

export interface RuleNodeData {
  title: string
  componentType: number
  category: NodeCategory
  scope: FlowScope
  description: string
  fixed?: boolean
  content: Record<string, unknown> | null
}

export interface ComponentTemplate {
  title: string
  componentType: number
  category: NodeCategory
  scopes: FlowScope[]
  description: string
  fixed?: boolean
  defaultContent: () => Record<string, unknown> | null
}

export interface RuleDesignDraft {
  info: RuleInfoDraft
  classes: Record<string, RuleClassDraft>
  cardsets: CardsetDraft[]
  cardsetComparisons: CardsetComparisonDraft[]
  matchFlow: FlowGraphDraft
  endFlow: FlowGraphDraft
}

export interface ValidationResult {
  level: 'error' | 'warning'
  message: string
}

export interface RuleRuntimeObject {
  id: string
  name: string
  className: 'player' | 'card' | 'table'
  properties: Record<string, unknown>
}

export interface RuleObjectPool {
  players: RuleRuntimeObject[]
  cards: RuleRuntimeObject[]
  table: RuleRuntimeObject
}

export type ExportedFlowNode = {
  type: number
  content: Record<string, unknown> | null
  count?: unknown
  next?: string
}

export type ExportedPropertyMap = Record<string, {
  type: DataType
  default: number
  config?: EnumOptionDraft[]
}>

export type ExportedMethodMap = Record<string, {
  parameters: Record<string, {
    type: DataType
  }>
  returns: DataType | null
  flow: Record<string, ExportedFlowNode>
}>

export type ExportedRuleDesign = {
  classes: Record<string, {
    default_properties: ExportedPropertyMap
    user_properties: ExportedPropertyMap
    methods: ExportedMethodMap
  }>
  cardsets: Record<string, {
    name: string
    properties: ExportedPropertyMap
    build_flow: Record<string, ExportedFlowNode>
    compare_flow: Record<string, ExportedFlowNode>
    successors: string[]
  }>
  cardset_comparisons: Record<string, {
    cardsetA: string
    cardsetB: string
    compare_flow: Record<string, ExportedFlowNode>
  }>
  match_flow: Record<string, ExportedFlowNode>
  end_flow: Record<string, ExportedFlowNode>
}
