/// <reference types="cypress" />

describe('online room pages', () => {
  it('creates a room and navigates to the game page', () => {
    cy.visit('/create-room')

    cy.contains('h1', 'Create Room').should('be.visible')
    cy.contains('Room Settings').should('be.visible')
    cy.contains('Classic Rules (4 players)').should('be.visible')
    cy.contains('button', 'Create Room').click()

    cy.location('pathname').should('match', /^\/game\/[A-Z0-9]{6}$/)
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('currentRoomCode')).to.match(/^[A-Z0-9]{6}$/)
    })
  })

  it('joins a password-protected room and navigates to the game page', () => {
    cy.visit('/join-room')

    cy.contains('h1', 'Join Room').should('be.visible')
    cy.get('.join-room-input input').type('123456')
    cy.contains('button', '加入房间').click()

    cy.contains('密码').should('be.visible')
    cy.get('.join-room-input input').type('abc123')
    cy.contains('button', '加入房间').click()

    cy.location('pathname').should('eq', '/game/123456')
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('currentRoomCode')).to.eq('123456')
    })
  })
})
