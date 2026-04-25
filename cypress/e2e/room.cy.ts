/// <reference types="cypress" />

describe('room sandbox', () => {
  it('allows the create room button to enable after typing', () => {
    cy.visit('/')

    cy.get('[data-testid="room-create-button"]').should('be.disabled')
    cy.get('[data-testid="room-create-input"]').type('Test Room')
    cy.get('[data-testid="room-create-button"]').should('not.be.disabled')
  })

  it('allows the join room button to enable for a valid room code', () => {
    cy.visit('/')

    cy.get('[data-testid="room-join-button"]').should('be.disabled')
    cy.get('[data-testid="room-join-input"]').type('ABCD')
    cy.get('[data-testid="room-join-button"]').should('not.be.disabled')
  })
})
