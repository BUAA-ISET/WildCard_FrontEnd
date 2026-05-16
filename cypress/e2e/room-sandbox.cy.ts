/// <reference types="cypress" />

describe('房间测试沙箱', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/__test__/room-sandbox', { timeout: 60000 })
  })

  it('创建房间按钮会随房间名输入启用', () => {
    cy.get('[data-testid="room-create-button"]').should('be.disabled')
    cy.get('[data-testid="room-create-input"]').type('Alpha Room')
    cy.get('[data-testid="room-create-button"]').should('not.be.disabled')
  })

  it('加入房间按钮需要至少四位房间号', () => {
    cy.get('[data-testid="room-join-button"]').should('be.disabled')
    cy.get('[data-testid="room-join-input"]').type('ABC')
    cy.get('[data-testid="room-join-button"]').should('be.disabled')
    cy.get('[data-testid="room-join-input"]').type('D')
    cy.get('[data-testid="room-join-button"]').should('not.be.disabled')
  })
})
