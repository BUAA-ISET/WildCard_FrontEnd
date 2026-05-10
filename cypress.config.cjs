const { defineConfig } = require('cypress')

module.exports = defineConfig({
  video: false,
  pageLoadTimeout: 300000,
  defaultCommandTimeout: 10000,
  e2e: {
    baseUrl: 'http://127.0.0.1:4173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
})
