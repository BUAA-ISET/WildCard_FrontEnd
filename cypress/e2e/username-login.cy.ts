/// <reference types="cypress" />

describe('用户名登录', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/user-info', { timeout: 60000 })
  })

  it('允许在登录账号输入框中使用用户名登录', () => {
    cy.intercept('POST', '**/api/user/login', (req) => {
      expect(req.body).to.deep.equal({
        email: 'alice',
        password: 'password123',
      })

      req.reply({
        success: true,
        data: {
          id: 'user-001',
          username: 'alice',
          email: 'alice@example.com',
          avatar: '',
          token: 'jwt-token',
        },
      })
    }).as('loginByUsername')

    cy.get('input').eq(0).type('alice')
    cy.get('input').eq(1).type('password123')
    cy.contains('button', '登录').click()

    cy.wait('@loginByUsername')
    cy.contains('.user-name', 'alice').should('be.visible')
    cy.contains('.user-email', 'alice@example.com').should('be.visible')
  })
})
