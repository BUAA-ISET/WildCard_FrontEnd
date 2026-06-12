/// <reference types="cypress" />

import { apiResponse, stubApiPreflight, stubExternalImages, visitAs } from './helpers'

const cardA = { id: 'a-heart', properties: { point: 1, suit: 1 }, display: { rank: 'A', suit: 'H' } }
const cardK = { id: 'k-spade', properties: { point: 13, suit: 0 }, display: { rank: 'K', suit: 'S' } }

const record = {
  id: 'replay-1',
  sessionId: 'session-1',
  roomCode: 'ROOM42',
  ruleId: 'war-rule',
  ruleName: 'War 拼点战争',
  startedAt: '2026-06-10T10:00:00.000Z',
  endedAt: '2026-06-10T10:05:00.000Z',
  result: 'win',
  players: [
    { id: 'player-1', username: '测试玩家', avatar: '' },
    { id: 'player-2', username: '对手', avatar: '' },
  ],
  winnerIds: ['player-1'],
}

const replay = {
  record,
  frames: [
    {
      index: 0,
      elapsedSeconds: 0,
      currentPlayerId: 'player-1',
      hands: { 'player-1': [cardA, cardK], 'player-2': [cardK] },
      tableCards: [],
      action: null,
    },
    {
      index: 1,
      elapsedSeconds: 22,
      currentPlayerId: 'player-2',
      hands: { 'player-1': [cardK], 'player-2': [cardK] },
      tableCards: [cardA],
      action: { playerId: 'player-1', action: 'playCards', cards: [cardA], message: '测试玩家打出了 A H', turn: 1 },
    },
  ],
}

describe('历史对局和回放 E2E', () => {
  beforeEach(() => {
    stubApiPreflight()
    stubExternalImages()
    cy.intercept('GET', /\/api\/replays\/history(?:\?.*)?$/, apiResponse({ success: true, data: [record] })).as('history')
    cy.intercept('GET', /\/api\/replays\/replay-1$/, apiResponse({ success: true, data: replay })).as('replay')
  })

  it('从历史对局进入回放并步进时间线', () => {
    visitAs('/match-history')
    cy.wait('@history')

    cy.contains('h1', '历史对局').should('be.visible')
    cy.contains('.history-card', 'War 拼点战争').within(() => {
      cy.contains('.result-mark', '胜').should('have.class', 'win')
      cy.contains('房间 ROOM42').should('be.visible')
      cy.contains('测试玩家、对手').should('be.visible')
      cy.contains('button', '查看回放').click()
    })

    cy.location('pathname').should('eq', '/match-history/replay-1')
    cy.wait('@replay')
    cy.contains('h1', 'War 拼点战争').should('be.visible')
    cy.contains('.summary-bar', 'ROOM42').should('be.visible')
    cy.contains('.summary-bar', '1/2').should('be.visible')
    cy.contains('.player-panel.active', '测试玩家').should('be.visible')
    cy.contains('.table-empty', '桌面暂无出牌').should('be.visible')

    cy.contains('button', '下一步').click()
    cy.contains('.summary-bar', '2/2').should('be.visible')
    cy.contains('.player-panel.active', '对手').should('be.visible')
    cy.contains('.table-card', 'A').should('be.visible')
    cy.contains('.action-text', '测试玩家打出了 A H').should('be.visible')

    cy.get('button[title="返回历史对局"]').click()
    cy.location('pathname').should('eq', '/match-history')
  })
})
