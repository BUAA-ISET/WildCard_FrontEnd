/// <reference types="cypress" />

type TestRole = 'user' | 'admin'

export const testUser = {
  id: 'player-1',
  username: '测试玩家',
  email: 'player@example.com',
  avatar: '',
  role: 'user',
  token: 'test-token-user',
}

export const adminUser = {
  ...testUser,
  id: 'admin-1',
  username: '审核员',
  email: 'admin@example.com',
  role: 'admin',
  token: 'test-token-admin',
}

export function corsHeaders(origin?: string | string[]) {
  const requestOrigin = Array.isArray(origin) ? origin[0] : origin
  return {
    'access-control-allow-origin': requestOrigin || '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-player-id,x-player-name,x-player-avatar,x-room-code',
  }
}

export function apiResponse<T>(body: T) {
  return (req: Cypress.Request) => {
    req.reply({
      headers: corsHeaders(req.headers.origin),
      body,
    })
  }
}

export function stubApiPreflight() {
  cy.intercept('OPTIONS', /\/api\/.*$/, (req) => {
    req.reply({
      statusCode: 204,
      headers: corsHeaders(req.headers.origin),
    })
  })
}

export function stubExternalImages() {
  cy.intercept('https://www.gravatar.com/**', {
    statusCode: 200,
    body: '',
    headers: { 'Content-Type': 'image/png' },
  })
}

export function visitAs(path: string, role: TestRole = 'user') {
  const user = role === 'admin' ? adminUser : testUser
  cy.intercept('GET', /\/api\/user\/current$/, apiResponse({ success: true, data: user })).as('getCurrentUser')
  cy.visit('/user-info', {
    timeout: 60000,
    onBeforeLoad(win) {
      win.sessionStorage.setItem('wildcard:default:user', JSON.stringify(user))
      win.sessionStorage.setItem('wildcard:default:auth-token', user.token)
    },
  })
  cy.wait('@getCurrentUser')

  if (path !== '/user-info') {
    cy.visit(path, {
      timeout: 60000,
    })
    cy.location('pathname').should('eq', path)
  }
}

export function stubRoomApis() {
  const rule = {
    id: 'classic',
    name: 'Classic Demo',
    playerCount: 2,
    description: 'Stable room rule for E2E tests.',
  }
  const hostRoom = {
    id: 'room-host',
    code: 'ABC123',
    hostId: testUser.id,
    playerCount: 2,
    roundTime: 30,
    ruleId: rule.id,
    ruleName: rule.name,
    password: null,
    hasPassword: false,
    players: [
      { id: testUser.id, username: testUser.username, avatar: '', isReady: true, joinedAt: 1 },
    ],
    status: 'waiting',
  }
  const guestRoom = {
    ...hostRoom,
    id: 'room-guest',
    code: '123456',
    hostId: 'host-player',
    password: 'abc123',
    hasPassword: true,
    players: [
      { id: 'host-player', username: '房主A', avatar: '', isReady: true, joinedAt: 1 },
      { id: testUser.id, username: testUser.username, avatar: '', isReady: false, joinedAt: 2 },
    ],
  }
  let currentRoom = hostRoom

  cy.intercept('GET', /\/api\/room\/rules$/, apiResponse({ success: true, data: [rule] })).as('roomRules')
  cy.intercept('POST', /\/api\/room\/create$/, (req) => {
    currentRoom = { ...hostRoom, roundTime: Number(req.body?.roundTime || 30) }
    req.reply({ headers: corsHeaders(req.headers.origin), body: { success: true, data: currentRoom } })
  }).as('createRoom')
  cy.intercept('GET', /\/api\/room\/check-password(?:\?.*)?$/, apiResponse({ success: true, hasPassword: true })).as('checkPassword')
  cy.intercept('POST', /\/api\/room\/join$/, (req) => {
    currentRoom = guestRoom
    req.reply({ headers: corsHeaders(req.headers.origin), body: { success: true, data: guestRoom } })
  }).as('joinRoom')
  cy.intercept('GET', /\/api\/room\/current(?:\?.*)?$/, (req) => {
    req.reply({ headers: corsHeaders(req.headers.origin), body: { success: true, data: currentRoom } })
  }).as('currentRoom')
  cy.intercept('POST', /\/api\/room\/leave$/, apiResponse({ success: true })).as('leaveRoom')
}
