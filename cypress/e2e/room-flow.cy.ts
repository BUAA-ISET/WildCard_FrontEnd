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

const room = {
  id: 'room-1',
  code: 'ROOM42',
  host_id: 'user-001',
  player_count: 2,
  round_time: 30,
  rule_id: 'rule-1',
  rule_name: 'Tiny Demo',
  password: null,
  has_password: false,
  players: [
    { id: 'user-001', username: 'alice', avatar: '', is_ready: true, joined_at: 1 },
  ],
  status: 'waiting',
}

describe('房间主流程', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
  })

  it('创建房间后进入准备房间', () => {
    cy.intercept('GET', '**/api/room/rules', {
      success: true,
      data: [{ id: 'rule-1', name: 'Tiny Demo', player_count: 2, description: 'demo' }],
    }).as('rules')
    cy.intercept('POST', '**/api/room/create', { success: true, data: room }).as('createRoom')
    cy.intercept('GET', '**/api/room/current?code=ROOM42', { success: true, data: room }).as('currentRoom')

    loginAndVisit('/create-room')
    cy.wait('@rules')
    cy.contains('button', '创建房间').click()
    cy.wait('@createRoom')

    cy.location('pathname').should('eq', '/game/ROOM42')
    cy.wait('@currentRoom')
    cy.contains('.summary-value', 'ROOM42').should('be.visible')
    cy.contains('.summary-value', 'Tiny Demo').should('be.visible')
  })

  it('加入无密码房间后进入准备房间', () => {
    cy.intercept('GET', '**/api/room/check-password?code=ROOM42', {
      success: true,
      hasPassword: false,
    }).as('checkPassword')
    cy.intercept('POST', '**/api/room/join', { success: true, data: room }).as('joinRoom')
    cy.intercept('GET', '**/api/room/current?code=ROOM42', { success: true, data: room })

    loginAndVisit('/join-room')
    cy.get('.join-room-input input').type('ROOM42')
    cy.contains('button', '加入房间').click()
    cy.wait('@checkPassword')
    cy.wait('@joinRoom')

    cy.location('pathname').should('eq', '/game/ROOM42')
    cy.contains('.summary-value', 'ROOM42').should('be.visible')
  })
})
