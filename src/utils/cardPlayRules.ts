import type { ExportedFlowNode, ExportedPropertyMap } from '../types/ruleBuilder'

export interface PlayCard {
  id: string
  rank: string
  point?: number
  suit?: string
  properties?: Record<string, number | string | boolean>
}

export interface CardSetDefinition {
  name: string
  properties: ExportedPropertyMap
  build_flow: Record<string, ExportedFlowNode>
  compare_flow: Record<string, ExportedFlowNode>
  successors: string[]
}

export interface RoomRuleDefinition {
  name: string
  player_count: number
  classes: Record<string, unknown>
  cardsets: Record<string, CardSetDefinition>
  match_flow: Record<string, ExportedFlowNode>
  end_flow: Record<string, ExportedFlowNode>
}

export interface RoomRuleResponse {
  room_id: string
  rule: RoomRuleDefinition
}

export interface RoundPlayRecord {
  cardsetId: string
  cardsetName: string
  cards: PlayCard[]
  properties: Record<string, unknown>
}

export interface CardPlayValidationInput {
  selectedCards: PlayCard[]
  handCards: PlayCard[]
  rule?: RoomRuleDefinition | null
  previousRoundPlay?: RoundPlayRecord | null
}

export interface CardPlayValidationResult {
  legal: boolean
  message: string
  roundPlay?: RoundPlayRecord
}

type RuntimeValue = unknown
type CompareFlowResult = number | boolean | null

interface RuntimeContext {
  cards: PlayCard[]
  flow: Record<string, ExportedFlowNode>
  cache: Map<string, RuntimeValue>
  currentRoundPlay?: RoundPlayRecord
  previousRoundPlay?: RoundPlayRecord
}

function hasDuplicateCardIds(cards: PlayCard[]) {
  return new Set(cards.map((card) => card.id)).size !== cards.length
}

function normalizeReference(value: unknown) {
  return String(value ?? '').trim()
}

function readCardPoint(card: PlayCard) {
  const point = card.point
    ?? card.properties?.point
    ?? card.properties?.rank
    ?? card.properties?.['点数']

  return typeof point === 'number' ? point : undefined
}

function readCardProperty(card: PlayCard, property: string): number | string | boolean | undefined {
  if (property === 'id') {
    return card.id
  }
  if (property === 'rank' || property === 'point' || property === '点数') {
    const point = readCardPoint(card)
    return point !== undefined ? point : 0
  }
  if (property === 'suit' || property === '花色') {
    return card.properties?.suit ?? card.suit
  }
  return card.properties?.[property]
}

function readRuntimeProperty(target: RuntimeValue, property: string): RuntimeValue {
  if (Array.isArray(target)) {
    return target.map((item) => readRuntimeProperty(item, property))
  }
  if (typeof target !== 'object' || target === null) {
    return undefined
  }

  const record = target as Record<string, unknown>
  if ('rank' in record || 'suit' in record) {
    return readCardProperty(target as PlayCard, property)
  }
  if (property === 'cards') {
    return record.cards
  }
  if (property === 'cardsetId') {
    return record.cardsetId
  }
  if (property === 'cardsetName') {
    return record.cardsetName
  }

  const properties = record.properties
  if (typeof properties === 'object' && properties !== null && property in properties) {
    return (properties as Record<string, unknown>)[property]
  }

  return record[property]
}

function isSelectedCardSetReference(value: string) {
  return ['cards', 'card_set', 'selectedCards', 'selected_cards', '初始牌组', '牌组'].includes(value)
}

function isCurrentRoundReference(value: string) {
  return ['A', 'a', 'cardsetA', 'cardset_a', 'currentRound', 'current_round', '牌型A'].includes(value)
}

function isPreviousRoundReference(value: string) {
  return ['B', 'b', 'cardsetB', 'cardset_b', 'previousRound', 'previous_round', '牌型B'].includes(value)
}

function resolveValue(value: unknown, context: RuntimeContext): RuntimeValue {
  if (typeof value !== 'string') {
    return value
  }

  const reference = normalizeReference(value)
  if (!reference) {
    return ''
  }
  if (isSelectedCardSetReference(reference)) {
    return context.cards
  }
  if (isCurrentRoundReference(reference)) {
    return context.currentRoundPlay
  }
  if (isPreviousRoundReference(reference)) {
    return context.previousRoundPlay
  }
  if (context.flow[reference]) {
    return evaluateNode(reference, context)
  }
  if (!Number.isNaN(Number(reference))) {
    return Number(reference)
  }
  if (reference === 'true') {
    return true
  }
  if (reference === 'false') {
    return false
  }

  return reference
}

function compareValues(operator: number, left: RuntimeValue, right: RuntimeValue) {
  switch (operator) {
    case 0:
      return left === right
    case 1:
      return Number(left) > Number(right)
    case 2:
      return Number(left) < Number(right)
    case 3:
      return Number(left) >= Number(right)
    case 4:
      return Number(left) <= Number(right)
    default:
      return false
  }
}

function evaluateCollectionLogic(operator: number, collection: RuntimeValue, component: unknown, context: RuntimeContext) {
  const items = Array.isArray(collection) ? collection : []
  const componentReference = normalizeReference(component)

  if (!componentReference) {
    return false
  }

  if (operator === 0) {
    return items.some(() => Boolean(resolveValue(componentReference, context)))
  }

  return items.every(() => Boolean(resolveValue(componentReference, context)))
}

function evaluateNode(nodeId: string, context: RuntimeContext): RuntimeValue {
  if (context.cache.has(nodeId)) {
    return context.cache.get(nodeId)
  }

  const node = context.flow[nodeId]
  const content = node?.content || {}
  let result: RuntimeValue = undefined

  switch (node?.type) {
    case 5: {
      const selection = resolveValue(content.selection, context)
      const index = Number(resolveValue(content.index, context))
      result = Array.isArray(selection) ? selection[index] : undefined
      break
    }
    case 6: {
      const property = normalizeReference(content.property)
      const ident = resolveValue(content.ident, context)
      result = readRuntimeProperty(ident, property)
      break
    }
    case 7: {
      const selection = resolveValue(content.selection, context)
      result = Array.isArray(selection) ? selection.length : 0
      break
    }
    case 8:
    case 9:
      result = content.value
      break
    case 10: {
      const left = Number(resolveValue(content.lval, context))
      const right = Number(resolveValue(content.rval, context))
      const operator = Number(content.operator)
      result = operator === 0 ? left + right : operator === 1 ? left - right : operator === 2 ? left * right : operator === 3 ? left / right : left % right
      break
    }
    case 11:
      result = evaluateCollectionLogic(Number(content.operator), resolveValue(content.set, context), content.component, context)
      break
    case 12: {
      const left = Boolean(resolveValue(content.lval, context))
      const right = Boolean(resolveValue(content.rval, context))
      result = Number(content.operator) === 0 ? left && right : left || right
      break
    }
    case 13:
      result = !Boolean(resolveValue(content.component, context))
      break
    case 14:
      result = compareValues(Number(content.operator), resolveValue(content.lval, context), resolveValue(content.rval, context))
      break
    case 28:
      result = Number(content.result) === 1
      break
    case 30:
      result = Number(content.result)
      break
    default:
      result = undefined
  }

  context.cache.set(nodeId, result)
  return result
}

function getNextNodeId(node: ExportedFlowNode, branch?: boolean) {
  const content = node.content || {}

  if (node.type === 16) {
    return normalizeReference(branch ? content.next_true : content.next_false)
  }

  return normalizeReference(content.next || node.next)
}

function executeBuildFlow(cards: PlayCard[], flow: Record<string, ExportedFlowNode>) {
  const context: RuntimeContext = {
    cards,
    flow,
    cache: new Map<string, RuntimeValue>(),
  }
  let currentNodeId = '1'
  const visited = new Set<string>()

  while (currentNodeId && flow[currentNodeId] && !visited.has(currentNodeId)) {
    visited.add(currentNodeId)
    const node = flow[currentNodeId]

    if (node.type === 16) {
      const branch = Boolean(resolveValue(node.content?.condition, context))
      currentNodeId = getNextNodeId(node, branch)
      continue
    }

    if (node.type === 28) {
      return {
        matched: Number(node.content?.result) === 1,
        properties: typeof node.content?.properties === 'object' && node.content.properties !== null
          ? node.content.properties as Record<string, unknown>
          : {},
      }
    }

    evaluateNode(currentNodeId, context)
    currentNodeId = getNextNodeId(node)
  }

  return { matched: false, properties: {} }
}

function recognizeCardPlay(cards: PlayCard[], rule: RoomRuleDefinition): RoundPlayRecord | null {
  for (const [cardsetId, cardset] of Object.entries(rule.cardsets || {})) {
    const result = executeBuildFlow(cards, cardset.build_flow)

    if (result.matched) {
      return {
        cardsetId,
        cardsetName: cardset.name,
        cards,
        properties: result.properties,
      }
    }
  }

  return null
}

function executeCompareFlow(
  currentRoundPlay: RoundPlayRecord,
  previousRoundPlay: RoundPlayRecord,
  flow: Record<string, ExportedFlowNode>,
): CompareFlowResult {
  const context: RuntimeContext = {
    cards: currentRoundPlay.cards,
    flow,
    cache: new Map<string, RuntimeValue>(),
    currentRoundPlay,
    previousRoundPlay,
  }
  let currentNodeId = '1'
  const visited = new Set<string>()

  while (currentNodeId && flow[currentNodeId] && !visited.has(currentNodeId)) {
    visited.add(currentNodeId)
    const node = flow[currentNodeId]

    if (node.type === 16) {
      const branch = Boolean(resolveValue(node.content?.condition, context))
      currentNodeId = getNextNodeId(node, branch)
      continue
    }

    if (node.type === 30) {
      const result = node.content?.result
      if (typeof result === 'boolean') {
        return result
      }
      if (typeof result === 'number') {
        return result
      }
      if (typeof result === 'string') {
        const normalizedResult = result.trim().toLowerCase()
        if (normalizedResult === 'true') {
          return true
        }
        if (normalizedResult === 'false') {
          return false
        }
        if (normalizedResult !== '' && !Number.isNaN(Number(normalizedResult))) {
          return Number(normalizedResult)
        }
      }

      return null
    }

    evaluateNode(currentNodeId, context)
    currentNodeId = getNextNodeId(node)
  }

  return null
}

function isCurrentRoundHigher(compareResult: CompareFlowResult) {
  if (typeof compareResult === 'boolean') {
    return compareResult
  }
  if (typeof compareResult === 'number') {
    return compareResult > 0
  }
  return false
}

function canBeatPreviousRound(currentRoundPlay: RoundPlayRecord, previousRoundPlay: RoundPlayRecord, rule: RoomRuleDefinition) {
  const currentCardset = rule.cardsets[currentRoundPlay.cardsetId]
  if (!currentCardset) {
    return false
  }

  if (currentRoundPlay.cardsetId === previousRoundPlay.cardsetId) {
    return isCurrentRoundHigher(executeCompareFlow(currentRoundPlay, previousRoundPlay, currentCardset.compare_flow))
  }

  return currentCardset.successors.includes(previousRoundPlay.cardsetId)
}

export function validateCardPlay({
  selectedCards,
  handCards,
  rule,
  previousRoundPlay = null,
}: CardPlayValidationInput): CardPlayValidationResult {
  if (!rule) {
    return { legal: false, message: '规则未加载，暂时无法判断出牌是否合法' }
  }
  if (selectedCards.length === 0) {
    return { legal: false, message: '请选择要出的牌' }
  }
  if (hasDuplicateCardIds(selectedCards)) {
    return { legal: false, message: '不能重复选择同一张牌' }
  }

  const handCardIds = new Set(handCards.map((card) => card.id))
  if (selectedCards.some((card) => !handCardIds.has(card.id))) {
    return { legal: false, message: '所选牌不在当前手牌中' }
  }

  const currentRoundPlay = recognizeCardPlay(selectedCards, rule)
  if (!currentRoundPlay) {
    return { legal: false, message: '不符合当前规则中的任何牌型' }
  }
  if (previousRoundPlay && !canBeatPreviousRound(currentRoundPlay, previousRoundPlay, rule)) {
    return { legal: false, message: '出牌必须符合当前规则的牌型优先级关系', roundPlay: currentRoundPlay }
  }

  return { legal: true, message: '出牌合法', roundPlay: currentRoundPlay }
}
