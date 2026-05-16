import { describe, expect, it } from 'vitest'
import type { PlayCard, RoomRuleDefinition, RoundPlayRecord } from '../cardPlayRules'
import { validateCardPlay } from '../cardPlayRules'

const singleCardRule: RoomRuleDefinition = {
  name: 'single-card',
  player_count: 2,
  classes: {},
  match_flow: {},
  end_flow: {},
  cardsets: {
    single: {
      name: 'Single',
      properties: {},
      build_flow: {
        '1': { type: 7, content: { selection: 'cards', next: '2' } },
        '2': { type: 8, content: { value: 1, next: '3' } },
        '3': { type: 14, content: { operator: 0, lval: '1', rval: '2', next: '4' } },
        '4': {
          type: 16,
          content: {
            condition: '3',
            next_true: '5',
            next_false: '6',
          },
        },
        '5': { type: 28, content: { result: 1, properties: { size: 1 } } },
        '6': { type: 28, content: { result: 0, properties: {} } },
      },
      compare_flow: {
        '1': { type: 5, content: { selection: 'A', index: 0, next: '2' } },
        '2': { type: 6, content: { ident: '1', property: 'point', next: '3' } },
        '3': { type: 5, content: { selection: 'B', index: 0, next: '4' } },
        '4': { type: 6, content: { ident: '3', property: 'point', next: '5' } },
        '5': { type: 14, content: { operator: 1, lval: '2', rval: '4', next: '6' } },
        '6': {
          type: 16,
          content: {
            condition: '5',
            next_true: '7',
            next_false: '8',
          },
        },
        '7': { type: 30, content: { result: 1 } },
        '8': { type: 30, content: { result: 0 } },
      },
      successors: [],
    },
  },
}

const handCards: PlayCard[] = [
  { id: 'card-a', rank: 'A', point: 14, suit: 'spade' },
  { id: 'card-k', rank: 'K', point: 13, suit: 'heart' },
]

function previousSingle(point: number): RoundPlayRecord {
  return {
    cardsetId: 'single',
    cardsetName: 'Single',
    cards: [{ id: `previous-${point}`, rank: String(point), point }],
    properties: { size: 1 },
  }
}

describe('validateCardPlay', () => {
  it('rejects duplicate selections before evaluating rules', () => {
    const result = validateCardPlay({
      selectedCards: [handCards[0], handCards[0]],
      handCards,
      rule: singleCardRule,
    })

    expect(result).toEqual({
      legal: false,
      message: '不能重复选择同一张牌',
    })
  })

  it('rejects cards that are not in the current hand', () => {
    const result = validateCardPlay({
      selectedCards: [{ id: 'unknown', rank: 'Q', point: 12 }],
      handCards,
      rule: singleCardRule,
    })

    expect(result).toEqual({
      legal: false,
      message: '所选牌不在当前手牌中',
    })
  })

  it('recognizes a valid single-card play and returns round metadata', () => {
    const result = validateCardPlay({
      selectedCards: [handCards[0]],
      handCards,
      rule: singleCardRule,
    })

    expect(result.legal).toBe(true)
    expect(result.message).toBe('出牌合法')
    expect(result.roundPlay).toMatchObject({
      cardsetId: 'single',
      cardsetName: 'Single',
      properties: { size: 1 },
    })
  })

  it('rejects a play that does not match any cardset build flow', () => {
    const result = validateCardPlay({
      selectedCards: handCards,
      handCards,
      rule: singleCardRule,
    })

    expect(result).toEqual({
      legal: false,
      message: '不符合当前规则中的任何牌型',
    })
  })

  it('uses the compare flow to reject a lower same-cardset play', () => {
    const result = validateCardPlay({
      selectedCards: [handCards[1]],
      handCards,
      rule: singleCardRule,
      previousRoundPlay: previousSingle(14),
    })

    expect(result.legal).toBe(false)
    expect(result.message).toBe('出牌必须符合当前规则的牌型优先级关系')
    expect(result.roundPlay?.cardsetId).toBe('single')
  })
})
