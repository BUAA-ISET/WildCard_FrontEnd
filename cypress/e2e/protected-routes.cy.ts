/// <reference types="cypress" />

describe('未登录路由保护', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
  })

  const protectedPaths = [
    '/create-room',
    '/join-room',
    '/creation-center/new',
  ]

  protectedPaths.forEach((path) => {
    it(`未登录访问 ${path} 会回到用户页`, () => {
      cy.visit(path, { timeout: 60000 })
      cy.location('pathname').should('eq', '/user-info')
      cy.contains('.el-tabs__item.is-active', '登录').should('be.visible')
    })
  })
})
