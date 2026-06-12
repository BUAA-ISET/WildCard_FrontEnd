/// <reference types="cypress" />

import { stubRoomApis, visitAs } from './helpers'

describe('online room pages', () => {
  it('creates a room and navigates to the game page', () => {
    stubRoomApis()
    visitAs('/create-room')

    cy.contains('h1', '创建房间').should('be.visible')
    cy.contains('房间设置').should('be.visible')
    cy.contains('Classic Demo（2人）').should('be.visible')
    cy.contains('button', '创建房间').click()
    cy.wait('@createRoom')

    cy.location('pathname').should('eq', '/game/ABC123')
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('currentRoomCode')).to.eq('ABC123')
    })
  })

  it('joins a password-protected room and navigates to the game page', () => {
    stubRoomApis()
    visitAs('/join-room')

    cy.contains('h1', '加入房间').should('be.visible')
    cy.get('.join-room-input input').type('123456')
    cy.contains('button', '加入房间').click()
    cy.wait('@checkPassword')

    cy.contains('密码').should('be.visible')
    cy.get('.join-room-input input').type('abc123')
    cy.contains('button', '加入房间').click()
    cy.wait('@joinRoom')

    cy.location('pathname').should('eq', '/game/123456')
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('currentRoomCode')).to.eq('123456')
    })
  })
})
