/// <reference types="cypress" />

const user = {
  id: 'user-001',
  username: 'alice',
  email: 'alice@example.com',
  avatar: '',
  token: 'jwt-token',
}

function navigateInApp(path: string) {
  cy.window().then((win) => {
    win.history.pushState({}, '', path)
    win.dispatchEvent(new win.PopStateEvent('popstate'))
  })
  cy.location('pathname').should('eq', path)
}

function loginAndVisit(path: string) {
  cy.intercept('POST', '**/api/user/login', {
    success: true,
    data: user,
  }).as('loginForRoute')

  cy.visit('/user-info', { timeout: 60000 })
  cy.get('input').eq(0).type(user.email)
  cy.get('input').eq(1).type('password123')
  cy.contains('button', '登录').click()
  cy.wait('@loginForRoute')
  cy.contains('.user-name', user.username).should('be.visible')
  navigateInApp(path)
}

describe('卡牌样式设置', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
  })

  it('保存样式设置并在重新进入页面后恢复', () => {
    loginAndVisit('/card-style')

    cy.contains('h2', '卡牌样式设置').should('be.visible')
    cy.get('select').eq(0).select('Times New Roman')
    cy.get('select').eq(1).select('柔和蓝紫')
    cy.get('input').eq(0).clear().type('https://example.test/front.png')
    cy.get('input').eq(1).clear().type('https://example.test/back.png')

    cy.window().then((win) => {
      expect(JSON.parse(win.localStorage.getItem('wildcard-card-style') || '{}')).to.deep.equal({
        fontFamily: "'Times New Roman', serif",
        theme: 'soft',
        frontImage: 'https://example.test/front.png',
        backImage: 'https://example.test/back.png',
      })
    })

    navigateInApp('/user-info')
    navigateInApp('/card-style')
    cy.get('select').eq(0).should('have.value', "'Times New Roman', serif")
    cy.get('select').eq(1).should('have.value', 'soft')
    cy.get('input').eq(0).should('have.value', 'https://example.test/front.png')
    cy.get('input').eq(1).should('have.value', 'https://example.test/back.png')
  })

  it('可以从已保存样式恢复默认样式', () => {
    loginAndVisit('/card-style')
    cy.window().then((win) => {
      win.localStorage.setItem('wildcard-card-style', JSON.stringify({
        fontFamily: "'Courier New', monospace",
        theme: 'green',
        frontImage: 'https://example.test/front.png',
        backImage: 'https://example.test/back.png',
      }))
    })
    navigateInApp('/user-info')
    navigateInApp('/card-style')

    cy.get('select').eq(1).should('have.value', 'green')
    cy.get('.plain-btn').click()

    cy.get('select').eq(0).should('have.value', 'Arial, sans-serif')
    cy.get('select').eq(1).should('have.value', 'classic')
    cy.window().then((win) => {
      expect(JSON.parse(win.localStorage.getItem('wildcard-card-style') || '{}')).to.deep.equal({
        fontFamily: 'Arial, sans-serif',
        theme: 'classic',
        frontImage: '',
        backImage: '',
      })
    })
  })
})
