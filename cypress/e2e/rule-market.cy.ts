/// <reference types="cypress" />

const rules = [
  {
    id: 'builtin-war-rule',
    name: 'War 拼点战争',
    description: '连续 5 轮翻牌比大小。',
    type: '对战',
    developer: { id: 'system', name: 'WildCard 内置', avatar: '' },
    rating: 4.8,
    reviewCount: 12,
    publishedAt: Date.parse('2026-05-29T00:00:00Z'),
  },
  {
    id: 'builtin-blackjack-rule',
    name: '21 点（伪版）',
    description: '双方各提交 3 张牌后直接比较。',
    type: '策略',
    developer: { id: 'dev-1', name: 'Rule Lab', avatar: '/avatar.png' },
    rating: 4.1,
    reviewCount: 5,
    publishedAt: Date.parse('2026-05-28T00:00:00Z'),
  },
]

const detail = {
  ...rules[0],
  introduction: '每名玩家翻出一张牌，点数更高者获得本轮胜场。',
  screenshots: [],
  reviews: [
    {
      id: 'review-1',
      authorName: '测试玩家',
      authorAvatar: '/avatar.png',
      rating: 5,
      content: '节奏很快',
      createdAt: Date.parse('2026-05-29T01:00:00Z'),
    },
  ],
}

const rooms = [
  {
    id: 'room-1',
    code: 'A1B2C3',
    hostName: '房主A',
    currentPlayers: 1,
    maxPlayers: 2,
    hasPassword: false,
    status: 'waiting',
  },
]

function corsHeaders(origin?: string | string[]) {
  const requestOrigin = Array.isArray(origin) ? origin[0] : origin
  return {
    'access-control-allow-origin': requestOrigin || '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  }
}

const testUser = {
  id: 'test-user',
  email: 'player@example.com',
  username: '测试玩家',
  avatar: '/avatar.png',
}

function apiResponse<T>(body: T) {
  return (req: Cypress.Request) => {
    req.reply({
      headers: corsHeaders(req.headers.origin),
      body,
    })
  }
}

function visitAsLoggedIn(path: string) {
  cy.visit('/user-info')
  cy.wait('@getCurrentUser')
  cy.visit(path)
}

describe('规则市场', () => {
  beforeEach(() => {
    cy.intercept('OPTIONS', /\/api\/.*$/, (req) => {
      req.reply({
        statusCode: 204,
        headers: corsHeaders(req.headers.origin),
      })
    })
    cy.intercept('GET', /\/api\/user\/current$/, apiResponse({ success: true, data: testUser })).as('getCurrentUser')
    cy.intercept('GET', /\/api\/rules\/published(?:\?.*)?$/, apiResponse({ success: true, data: rules })).as('listRules')
    cy.intercept('GET', /\/api\/rules\/published\/[^/]+\/rooms$/, apiResponse({ success: true, data: rooms })).as('listRuleRooms')
    cy.intercept('GET', /\/api\/rules\/developers\/system\/rules(?:\?.*)?$/, apiResponse({ success: true, data: [rules[0]] })).as('listDeveloperRules')
    cy.intercept('GET', /\/api\/rules\/published\/builtin-war-rule$/, apiResponse({ success: true, data: detail })).as('getRuleDetail')
    cy.intercept('POST', /\/api\/rules\/published\/builtin-war-rule\/reviews$/, apiResponse({
      success: true,
      data: {
        id: 'review-2',
        authorName: '我',
        authorAvatar: '/me.png',
        rating: 5,
        content: '值得推荐',
        createdAt: Date.parse('2026-05-30T00:00:00Z'),
      },
    })).as('postReview')
    cy.intercept('POST', /\/api\/rules\/published\/builtin-war-rule\/fork$/, apiResponse({
      success: true,
      data: {
        id: 'forked-war-rule',
        status: 'draft',
        updatedAt: Date.parse('2026-05-30T00:00:00Z'),
      },
    })).as('forkRule')
  })

  it('浏览、搜索并进入规则详情', () => {
    visitAsLoggedIn('/rule-market')
    cy.wait('@listRules')

    cy.contains('h1', '规则市场').should('be.visible')
    cy.contains('.rule-card', 'War 拼点战争').should('be.visible')
    cy.contains('.rule-card', 'WildCard 内置').should('be.visible')

    cy.get('.keyword-input input').clear().type('War')
    cy.contains('button', '搜索').click()
    cy.wait('@listRules').its('request.url').should('include', 'keyword=War')

    cy.contains('.rule-card', 'War 拼点战争').click()
    cy.location('pathname').should('eq', '/rule-market/builtin-war-rule')
    cy.wait('@getRuleDetail')
    cy.contains('h1', 'War 拼点战争').should('be.visible')
    cy.contains('每名玩家翻出一张牌').should('be.visible')
    cy.contains('.review-item', '节奏很快').scrollIntoView().should('be.visible')
  })

  it('已登录用户可以 Fork 规则副本', () => {
    visitAsLoggedIn('/rule-market')
    cy.wait('@listRules')

    cy.contains('.rule-card', 'War 拼点战争').within(() => {
      cy.contains('button', 'Fork').click()
    })
    cy.get('.el-message-box').within(() => {
      cy.get('input').clear().type('War 战争副本')
      cy.contains('button', '创建副本').click()
    })

    cy.wait('@forkRule').its('request.body').should('deep.eq', {
      name: 'War 战争副本',
    })
    cy.location('pathname').should('eq', '/creation-center/forked-war-rule')
  })

  it('详情页可以提交评论并跳转到快速用规则创建房间', () => {
    visitAsLoggedIn('/rule-market/builtin-war-rule')
    cy.wait('@getRuleDetail')

    cy.get('.review-form textarea').type('值得推荐')
    cy.contains('button', '提交评论').click()
    cy.wait('@postReview').its('request.body').should('deep.include', {
      rating: 5,
      content: '值得推荐',
    })
    cy.contains('.review-item', '值得推荐').should('be.visible')

    cy.contains('button', '快速使用规则').click()
    cy.location('pathname').should('eq', '/create-room')
    cy.location('search').should('include', 'ruleId=builtin-war-rule')
  })

  it('可以从详情页进入开发者规则和在线房间', () => {
    visitAsLoggedIn('/rule-market/builtin-war-rule')
    cy.wait('@getRuleDetail')

    cy.get('.developer-card').click()
    cy.location('pathname').should('eq', '/rule-market/developer/system')
    cy.wait('@listDeveloperRules')
    cy.contains('h1', 'WildCard 内置').should('be.visible')
    cy.contains('.rule-row', 'War 拼点战争').should('be.visible')

    cy.contains('.rule-row', 'War 拼点战争').click()
    cy.location('pathname').should('eq', '/rule-market/builtin-war-rule')
    cy.wait('@getRuleDetail')

    cy.contains('button', '搜索房间').click()
    cy.location('pathname').should('eq', '/rule-market/builtin-war-rule/rooms')
    cy.wait('@listRuleRooms')
    cy.wait('@getRuleDetail')
    cy.contains('h1', 'War 拼点战争').should('be.visible')
    cy.contains('.room-card', 'A1B2C3').should('be.visible')
    cy.contains('.room-card', 'A1B2C3').contains('button', '加入').click()
    cy.location('pathname').should('eq', '/join-room')
    cy.location('search').should('include', 'code=A1B2C3')
  })
})
