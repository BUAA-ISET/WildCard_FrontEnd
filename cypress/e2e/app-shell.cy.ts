/// <reference types="cypress" />

describe('应用公开路由', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
  })

  it('用户页可以直接访问', () => {
    cy.visit('/user-info', { timeout: 60000 })
    cy.get('.auth-logo').should('be.visible')
    cy.contains('.el-tabs__item.is-active', '登录').should('be.visible')
  })
})
