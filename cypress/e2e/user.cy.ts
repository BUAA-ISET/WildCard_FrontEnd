/// <reference types="cypress" />

import { visitAs } from './helpers'

describe('user shell', () => {
  it('renders the application shell and home entry actions', () => {
    visitAs('/')

    cy.get('[data-testid="app-shell"]').should('exist')
    cy.contains('WildCard').should('be.visible')
    cy.contains('button', '创建房间').should('be.visible')
    cy.contains('button', '加入房间').should('be.visible')
  })
})
