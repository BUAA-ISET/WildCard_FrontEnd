/// <reference types="cypress" />

import { stubApiPreflight, stubExternalImages, visitAs } from './helpers'

describe('卡牌样式设置 E2E', () => {
  beforeEach(() => {
    stubApiPreflight()
    stubExternalImages()
  })

  it('保存、恢复并重置卡牌字体、主题和图片 URL', () => {
    visitAs('/card-style')

    cy.contains('h2', '卡牌样式设置').should('be.visible')
    cy.contains('h2', '实时预览').should('be.visible')
    cy.get('.front-card').should('have.class', 'theme-classic')

    cy.contains('.setting-row', '字符字体').find('select').select("'Courier New', monospace")
    cy.contains('.setting-row', '颜色风格').find('select').select('green')
    cy.get('input[placeholder="留空则使用默认白色牌面"]').clear().type('https://example.test/front.png')
    cy.get('input[placeholder="留空则使用默认卡通牌背"]').clear().type('https://example.test/back.png')

    cy.get('.front-card').should('have.class', 'theme-green')
    cy.window().then((win) => {
      const saved = JSON.parse(win.localStorage.getItem('wildcard-card-style') || '{}')
      expect(saved.fontFamily).to.eq("'Courier New', monospace")
      expect(saved.theme).to.eq('green')
      expect(saved.frontImage).to.eq('https://example.test/front.png')
      expect(saved.backImage).to.eq('https://example.test/back.png')
    })

    cy.reload()
    cy.contains('.setting-row', '字符字体').find('select').should('have.value', "'Courier New', monospace")
    cy.contains('.setting-row', '颜色风格').find('select').should('have.value', 'green')
    cy.get('input[placeholder="留空则使用默认白色牌面"]').should('have.value', 'https://example.test/front.png')
    cy.get('input[placeholder="留空则使用默认卡通牌背"]').should('have.value', 'https://example.test/back.png')

    cy.contains('button', '恢复默认').click()
    cy.contains('.setting-row', '字符字体').find('select').should('have.value', 'Arial, sans-serif')
    cy.contains('.setting-row', '颜色风格').find('select').should('have.value', 'classic')
    cy.get('.front-card').should('have.class', 'theme-classic')
  })
})
