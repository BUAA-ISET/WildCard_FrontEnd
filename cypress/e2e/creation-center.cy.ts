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

describe('创作中心', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
  })

  it('展示草稿列表', () => {
    cy.intercept('GET', '**/api/rules/drafts', {
      success: true,
      data: [
        {
          id: 'draft 1',
          name: '单张规则',
          playerCount: 2,
          description: '单张出牌流程',
          status: 'draft',
          updatedAt: 1700000000000,
        },
      ],
    }).as('listDrafts')

    loginAndVisit('/creation-center')
    cy.wait('@listDrafts')

    cy.contains('.rule-row', '单张规则').should('be.visible')
  })

  it('创建新规则会进入规则构建页', () => {
    cy.intercept('GET', '**/api/rules/drafts', { success: true, data: [] })

    loginAndVisit('/creation-center')
    cy.contains('button', '创建新规则').click()

    cy.location('pathname').should('eq', '/creation-center/new')
    cy.contains('h1', '规则构建').should('be.visible')
  })

  it('确认后删除草稿并从列表移除', () => {
    cy.intercept('GET', '**/api/rules/drafts', {
      success: true,
      data: [
        {
          id: 'draft-delete',
          name: '待删除规则',
          playerCount: 2,
          description: 'delete me',
          status: 'draft',
          updatedAt: 1700000000000,
        },
      ],
    })
    cy.intercept('DELETE', '**/api/rules/drafts/draft-delete', {
      success: true,
      data: {
        id: 'draft-delete',
        name: '待删除规则',
        playerCount: 2,
        description: 'delete me',
        status: 'draft',
        updatedAt: 1700000000000,
      },
    }).as('deleteDraft')

    loginAndVisit('/creation-center')
    cy.contains('.rule-row', '待删除规则').within(() => {
      cy.contains('button', '删除').click()
    })
    cy.contains('.el-message-box', '删除规则').should('be.visible')
    cy.get('.el-message-box').contains('button', '删除').click()
    cy.wait('@deleteDraft')

    cy.contains('.rule-row', '待删除规则').should('not.exist')
  })
})
