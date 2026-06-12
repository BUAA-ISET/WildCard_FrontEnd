/// <reference types="cypress" />

import { visitAs } from './helpers'

describe('规则构建器测试', () => {
  beforeEach(() => {
    visitAs('/creation-center/new')
    cy.intercept('https://www.gravatar.com/**', { statusCode: 200, body: '', headers: { 'Content-Type': 'image/png' } })
  })

  describe('页面渲染', () => {
    it('显示规则构建页面标题', () => {
      cy.contains('h1', '规则构建').should('be.visible')
    })

    it('显示当前规则名称和玩家数', () => {
      cy.get('.builder-header p').should('contain', '人')
    })

    it('显示保存草稿按钮', () => {
      cy.contains('.builder-header', '保存草稿').should('be.visible')
    })

    it('显示JSON预览切换按钮', () => {
      cy.contains('.builder-header', '显示 JSON').should('be.visible')
    })
  })

  describe('工作区切换', () => {
    it('默认显示基础与牌型工作区', () => {
      cy.contains('.workspace-tab', '基础与牌型').should('have.class', 'active')
    })

    it('可以切换到方法流程工作区', () => {
      cy.contains('.workspace-tab', '方法流程').click()
      cy.contains('.workspace-tab', '方法流程').should('have.class', 'active')
    })

    it('可以切换到牌型构建流程工作区', () => {
      cy.contains('.workspace-tab', '牌型构建流程').click()
      cy.contains('.workspace-tab', '牌型构建流程').should('have.class', 'active')
    })

    it('可以切换到结算流程工作区', () => {
      cy.contains('.workspace-tab', '结算流程').click()
      cy.contains('.workspace-tab', '结算流程').should('have.class', 'active')
    })
  })

  describe('结构面板功能', () => {
    it('显示规则结构面板', () => {
      cy.contains('h2', '规则结构').should('be.visible')
    })

    it('显示基础信息表单', () => {
      cy.contains('.section-title', '基础信息').should('be.visible')
      cy.contains('label', '规则名称').should('be.visible')
      cy.contains('label', '游玩人数').should('be.visible')
    })

    it('显示对象摘要', () => {
      cy.contains('.object-summary', '玩家对象').scrollIntoView().should('be.visible')
      cy.contains('.object-summary', '牌对象').scrollIntoView().should('be.visible')
      cy.contains('.object-summary', '牌桌对象').scrollIntoView().should('be.visible')
    })
  })

  describe('JSON预览功能', () => {
    it('点击显示JSON按钮可以切换JSON预览显示状态', () => {
      cy.contains('button', '显示 JSON').click()
      cy.get('.builder-main.with-json').should('exist')
    })

    it('点击隐藏JSON按钮关闭预览', () => {
      cy.contains('button', '显示 JSON').click()
      cy.contains('button', '隐藏 JSON').should('exist')
    })
  })
})
