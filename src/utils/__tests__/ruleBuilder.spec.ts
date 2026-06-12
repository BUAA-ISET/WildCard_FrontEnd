import { describe, expect, it } from 'vitest'
import {
  createInitialDesign,
  exportRuleDesign,
  getCardFaceAssetKey,
  importRuleDesign,
} from '../ruleBuilder'

describe('ruleBuilder assets', () => {
  it('exports card faces, card back, and background assets using backend field names', () => {
    const design = createInitialDesign()
    const faceKey = getCardFaceAssetKey({ 点数: 1, 花色: 0 })
    design.assets.cardFaces[faceKey] = {
      properties: { 点数: 1, 花色: 0 },
      imageUrl: '/static/rule-assets/ace-spade.png',
    }
    design.assets.cardBack = '/static/rule-assets/back.png'
    design.assets.background = '/static/rule-assets/table.png'

    const exported = exportRuleDesign(design)

    expect(exported.assets).toEqual({
      card_faces: {
        [faceKey]: {
          properties: { 点数: 1, 花色: 0 },
          image_url: '/static/rule-assets/ace-spade.png',
        },
      },
      card_back: '/static/rule-assets/back.png',
      background: '/static/rule-assets/table.png',
    })
  })

  it('imports backend assets and ignores card face entries without images', () => {
    const imported = importRuleDesign({
      classes: {},
      cardsets: {},
      cardset_comparisons: {},
      match_flow: {},
      end_flow: {},
      assets: {
        card_faces: {
          valid: {
            properties: { 点数: 13, 花色: 3 },
            image_url: '/static/rule-assets/king-diamond.png',
          },
          empty: {
            properties: { 点数: 1, 花色: 0 },
            image_url: '',
          },
        },
        card_back: '/static/rule-assets/back.png',
        background: '/static/rule-assets/table.png',
      },
    })

    expect(imported.assets.cardBack).toBe('/static/rule-assets/back.png')
    expect(imported.assets.background).toBe('/static/rule-assets/table.png')
    expect(imported.assets.cardFaces).toEqual({
      valid: {
        properties: { 点数: 13, 花色: 3 },
        imageUrl: '/static/rule-assets/king-diamond.png',
      },
    })
  })
})
