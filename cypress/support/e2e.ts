/// <reference types="cypress" />

Cypress.on('uncaught:exception', () => false)

beforeEach(() => {
  cy.clearCookies()
  cy.clearLocalStorage()
  cy.clearAllSessionStorage()
  cy.intercept('https://www.gravatar.com/**', {
    statusCode: 200,
    body: '',
    headers: { 'Content-Type': 'image/png' }
  })
})

afterEach(() => {
  cy.clearCookies()
  cy.clearLocalStorage()
  cy.clearAllSessionStorage()
})
