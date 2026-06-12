/// <reference types="cypress" />

import { apiResponse, stubApiPreflight, stubExternalImages, visitAs } from './helpers'

const design = {
  info: { name: 'War 改版', playerCount: 2, description: '拼点规则' },
  classes: {},
  cardsets: [],
  cardsetComparisons: [],
  matchFlow: { nodes: [], edges: [] },
  endFlow: { nodes: [], edges: [] },
  assets: { cardFaces: {}, cardBack: '', background: '' },
}

const drafts = [
  {
    id: 'draft-1',
    name: 'War 改版',
    playerCount: 2,
    description: '拼点规则',
    status: 'draft',
    updatedAt: Date.parse('2026-06-10T10:00:00Z'),
  },
  {
    id: 'draft-2',
    name: '待审核规则',
    playerCount: 4,
    description: '已提交',
    status: 'pendingReview',
    updatedAt: Date.parse('2026-06-10T11:00:00Z'),
  },
  {
    id: 'draft-3',
    name: '被驳回规则',
    playerCount: 3,
    description: '需要补充资料',
    status: 'rejected',
    rejectReason: '请补充截图和玩法说明',
    updatedAt: Date.parse('2026-06-10T12:00:00Z'),
  },
]

const draftDetail = {
  ...drafts[2],
  createdAt: Date.parse('2026-06-09T12:00:00Z'),
  introduction: '旧玩法介绍',
  coverUrl: '/static/rule-images/cover.png',
  screenshotUrls: ['/static/rule-images/shot-1.png'],
  design,
}

describe('创作中心和规则发布 E2E', () => {
  beforeEach(() => {
    stubApiPreflight()
    stubExternalImages()
    cy.intercept('GET', /\/api\/rules\/drafts$/, apiResponse({ success: true, data: drafts })).as('listDrafts')
    cy.intercept('GET', /\/api\/rules\/drafts\/draft-3$/, apiResponse({ success: true, data: draftDetail })).as('getDraft')
    cy.intercept('PUT', /\/api\/rules\/drafts\/draft-3$/, apiResponse({ success: true, data: { id: 'draft-3', updatedAt: Date.now() } })).as('updateDraft')
    cy.intercept('POST', /\/api\/rules\/drafts\/draft-3\/submit-review$/, apiResponse({
      success: true,
      data: { id: 'draft-3', status: 'pendingReview', updatedAt: Date.now() },
    })).as('submitReview')
    cy.intercept('DELETE', /\/api\/rules\/drafts\/draft-1$/, apiResponse({ success: true, data: drafts[0] })).as('deleteDraft')
  })

  it('展示草稿状态、驳回原因，并从驳回规则重新提交审核', () => {
    visitAs('/creation-center')
    cy.wait('@listDrafts')

    cy.contains('h1', '创作中心').should('be.visible')
    cy.contains('.rule-row', 'War 改版').within(() => {
      cy.contains('.status-pill', '草稿').should('have.class', 'draft')
      cy.contains('button', '发布规则').should('be.enabled')
    })
    cy.contains('.rule-row', '待审核规则').within(() => {
      cy.contains('.status-pill', '审核中').should('have.class', 'pendingReview')
      cy.contains('button', '审核中').should('be.disabled')
    })
    cy.contains('.rule-row', '被驳回规则').within(() => {
      cy.contains('.status-pill', '已驳回').should('have.class', 'rejected')
      cy.contains('驳回原因：请补充截图和玩法说明').should('be.visible')
      cy.contains('button', '重新发布').click()
    })

    cy.location('pathname').should('eq', '/creation-center/draft-3/publish')
    cy.wait('@getDraft')
    cy.contains('h1', '发布规则').should('be.visible')
    cy.contains('.reject-banner', '请补充截图和玩法说明').should('be.visible')
    cy.get('.cover-preview img').should('have.attr', 'src').and('include', '/static/rule-images/cover.png')
    cy.get('.shot-item').should('have.length', 1)

    cy.get('textarea').clear().type('补充后的玩法介绍\n包含胜负判定和截图说明')
    cy.contains('button', '保存草稿').click()
    cy.wait('@updateDraft').its('request.body').should((body) => {
      expect(body.introduction).to.include('补充后的玩法介绍')
      expect(body.coverUrl).to.eq('/static/rule-images/cover.png')
      expect(body.screenshotUrls).to.deep.eq(['/static/rule-images/shot-1.png'])
      expect(body.design).to.deep.eq(design)
    })

    cy.contains('button', '重新提交审核').click()
    cy.wait('@updateDraft')
    cy.wait('@submitReview')
    cy.contains('button', '审核中').should('be.disabled')
  })

  it('支持从创作中心删除单个草稿并刷新列表状态', () => {
    visitAs('/creation-center')
    cy.wait('@listDrafts')

    cy.contains('.rule-row', 'War 改版').within(() => {
      cy.contains('button', '删除').click()
    })
    cy.get('.el-message-box').contains('button', '删除').click()
    cy.wait('@deleteDraft')
    cy.contains('.rule-row', 'War 改版').should('not.exist')
  })
})
