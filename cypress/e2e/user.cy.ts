/// <reference types="cypress" />

describe('user shell', () => {
  it('renders the application shell and starter heading', () => {
    cy.visit('/')

    cy.get('[data-testid="app-shell"]').should('exist')
    cy.contains('h1', 'Get started').should('be.visible')
  })
})
