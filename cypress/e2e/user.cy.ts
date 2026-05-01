/// <reference types="cypress" />

describe('user shell', () => {
  it('renders the application shell and home entry actions', () => {
    cy.visit('/', { timeout: 60000 })

    cy.get('[data-testid="app-shell"]').should('exist')
    cy.contains('WildCard').should('be.visible')
    cy.contains('button', 'CREATE ROOM').should('be.visible')
    cy.contains('button', 'JOIN ROOM').should('be.visible')
  })
})
