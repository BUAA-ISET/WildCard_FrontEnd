/// <reference types="cypress" />

import { apiResponse, stubApiPreflight, stubExternalImages, visitAs } from './helpers'

const pendingDrafts = [
  {
    draftId: 'review-draft-1',
    name: '待审 War 规则',
    ownerId: 'author-1',
    ownerName: '作者甲',
    playerCount: 2,
    description: '需要审核的拼点规则',
    introduction: '每轮比较牌面点数。',
    coverUrl: '/static/rule-images/review-cover.png',
    screenshotUrls: ['/static/rule-images/review-shot.png'],
    updatedAt: Date.parse('2026-06-10T13:00:00Z'),
    design: { nodes: [{ id: 'start' }] },
  },
]

const reports = [
  {
    id: 'report-1',
    reporterId: 'player-1',
    reporterName: '测试玩家',
    reporterAvatar: '',
    targetType: 'player_behavior',
    targetId: 'room-42:bad-player',
    reason: '恶意拖延',
    details: '最后一轮长时间不操作',
    status: 'pending',
    createdAt: Date.parse('2026-06-10T14:00:00Z'),
    updatedAt: Date.parse('2026-06-10T14:00:00Z'),
    context: { targetLabel: 'BadPlayer 的对局行为', sourcePath: '/game/ROOM42/battle' },
  },
  {
    id: 'report-2',
    reporterId: 'player-2',
    reporterName: '另一玩家',
    targetType: 'rule',
    targetId: 'rule-9',
    reason: '疑似抄袭',
    details: '规则描述高度相似',
    status: 'pending',
    createdAt: Date.parse('2026-06-10T15:00:00Z'),
    updatedAt: Date.parse('2026-06-10T15:00:00Z'),
    context: { targetLabel: '可疑规则' },
  },
]

describe('审核后台 E2E', () => {
  beforeEach(() => {
    stubApiPreflight()
    stubExternalImages()
    cy.intercept('GET', /\/api\/admin\/rules\/pending$/, apiResponse({ success: true, data: pendingDrafts })).as('listPendingRules')
    cy.intercept('POST', /\/api\/admin\/rules\/review-draft-1\/approve$/, apiResponse({
      success: true,
      data: { ruleId: 'published-rule-1', version: 1, status: 'published' },
    })).as('approveRule')
    cy.intercept('POST', /\/api\/admin\/rules\/review-draft-1\/reject$/, apiResponse({
      success: true,
      data: { id: 'review-draft-1', status: 'rejected', updatedAt: Date.now() },
    })).as('rejectRule')

    cy.intercept('GET', /\/api\/reports\/counts$/, apiResponse({ success: true, data: { pending: 2 } })).as('reportCounts')
    cy.intercept('GET', /\/api\/reports(?:\?.*)?$/, apiResponse({ success: true, data: reports })).as('listReports')
    cy.intercept('POST', /\/api\/reports\/report-1\/action$/, apiResponse({
      success: true,
      data: { ...reports[0], status: 'resolved' },
    })).as('reportAction')
  })

  it('管理员可以预览待审规则 JSON 并批准发布', () => {
    visitAs('/admin/rules-review', 'admin')
    cy.wait('@listPendingRules')

    cy.contains('h1', '规则审核').should('be.visible')
    cy.contains('.pending-row', '待审 War 规则').click()
    cy.contains('.detail-panel', '每轮比较牌面点数').should('be.visible')
    cy.get('.detail-cover').should('have.attr', 'src').and('include', '/static/rule-images/review-cover.png')
    cy.contains('button', '查看规则 JSON').click()
    cy.get('.design-json').should('contain', 'start')

    cy.contains('button', '批准发布').click()
    cy.get('.el-message-box').contains('button', '批准').click()
    cy.wait('@approveRule')
    cy.contains('规则已批准发布').should('be.visible')
  })

  it('管理员驳回规则时提交必填原因', () => {
    visitAs('/admin/rules-review', 'admin')
    cy.wait('@listPendingRules')

    cy.contains('.pending-row', '待审 War 规则').click()
    cy.contains('button', '驳回').click()
    cy.get('.el-message-box textarea').type('玩法说明不完整，请补充结算示例')
    cy.get('.el-message-box').contains('button', '驳回').click()
    cy.wait('@rejectRule').its('request.body').should('deep.eq', {
      reason: '玩法说明不完整，请补充结算示例',
    })
    cy.contains('规则已驳回').should('be.visible')
  })

  it('管理员可以筛选举报并处理对局行为举报', () => {
    visitAs('/admin/reports-review', 'admin')
    cy.wait('@listReports')
    cy.wait('@reportCounts')

    cy.contains('h1', '举报审核').should('be.visible')
    cy.contains('待处理 2').should('be.visible')
    cy.contains('.report-list-item', 'BadPlayer 的对局行为').should('have.class', 'active')
    cy.contains('.report-detail', '最后一轮长时间不操作').should('be.visible')

    cy.get('input[placeholder="搜索目标、理由或说明"]').clear().type('拖延')
    cy.contains('.filter-bar button', '筛选').click()
    cy.wait('@listReports').its('request.url').should('include', 'keyword=%E6%8B%96%E5%BB%B6')

    cy.contains('.detail-actions button', '封禁用户').click()
    cy.get('.el-message-box textarea').type('已核实，封禁 24 小时')
    cy.get('.el-message-box').contains('button', '确认').click()
    cy.wait('@reportAction').its('request.body').should('deep.eq', {
      action: 'ban_user',
      note: '已核实，封禁 24 小时',
      params: { targetType: 'player_behavior', targetId: 'room-42:bad-player' },
    })
    cy.contains('处理完成').should('be.visible')
  })
})
