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

const snapshot = {
  sessionId: 'session-1',
  roomCode: 'ROOM42',
  ruleId: 'rule-1',
  status: 'playing',
  currentPlayerId: 'user-001',
  roundTime: 30,
  deadlineAt: null,
  players: [
    { id: 'user-001', username: 'alice', avatar: '', cardCount: 1, online: true },
    { id: 'user-002', username: 'bob', avatar: '', cardCount: 2, online: true },
  ],
  table: {
    playedCards: [{ id: 'table-card', properties: { point: 13, suit: 1 }, display: { rank: 'K', suit: 'H' } }],
    passStreak: 0,
    lastPlayedBy: 'user-002',
  },
  handCards: [
    { id: 'card-a', properties: { point: 14, suit: 0 }, display: { rank: 'A', suit: 'S' } },
  ],
  pendingAction: {
    actionId: 'action-1',
    playerId: 'user-001',
    actionType: 'playCards',
    canSkip: true,
  },
  lastAction: null,
  winnerIds: [],
}

describe('战斗页交互', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
  })

  it('加载手牌、选择手牌并提交出牌动作', () => {
    cy.intercept('GET', '**/api/games/current?roomCode=ROOM42', {
      success: true,
      data: snapshot,
    }).as('currentGame')
    cy.intercept('POST', '**/api/games/session-1/actions/action-1/play-cards', {
      success: true,
      data: {
        ...snapshot,
        handCards: [],
        table: {
          ...snapshot.table,
          playedCards: snapshot.handCards,
          lastPlayedBy: 'user-001',
        },
        pendingAction: null,
        lastAction: {
          playerId: 'user-001',
          action: 'playCards',
          cards: snapshot.handCards,
          message: '打出了 1 张牌',
          turn: 1,
        },
      },
    }).as('playCards')

    loginAndVisit('/game/ROOM42/battle')
    cy.wait('@currentGame')

    cy.contains('.turn-text', '轮到你出牌').should('be.visible')
    cy.contains('.hand-card', 'A').click()
    cy.get('.hand-card.selected').should('have.length', 1)
    cy.contains('button', 'PLAY').click()
    cy.wait('@playCards').its('request.body').should('deep.equal', { cardIds: ['card-a'] })
    cy.contains('.turn-text', '打出了 1 张牌').should('be.visible')
  })
})
