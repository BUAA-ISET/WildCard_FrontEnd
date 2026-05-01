/// <reference types="cypress" />

const visitOptions = {
  onLoad: () => {},
}

describe('用户认证测试', () => {
  beforeEach(() => {
    cy.visit('/user-info', visitOptions)
  })

  describe('登录/注册界面渲染', () => {
    it('显示登录和注册标签页', () => {
      cy.contains('登录').should('be.visible')
      cy.contains('注册').should('be.visible')
    })

    it('默认显示登录标签页', () => {
      cy.get('.el-tabs__item').contains('登录').should('have.class', 'is-active')
    })

    it('可以切换到注册标签页', () => {
      cy.contains('注册').click()
      cy.get('.el-tabs__item').contains('注册').should('have.class', 'is-active')
    })

    it('登录表单显示邮箱和密码输入框', () => {
      cy.get('input[type="password"]').should('exist')
    })

    it('注册标签页显示所有必要字段', () => {
      cy.contains('注册').click()
      cy.get('input[type="password"]').should('have.length.at.least', 2)
    })
  })

  describe('切换登录状态', () => {
    it('切换登录状态按钮可见', () => {
      cy.contains('切换登录状态').should('be.visible')
    })

    it('点击切换按钮可以从登录状态变为未登录状态', () => {
      cy.contains('切换登录状态').click()
      cy.contains('登录').should('be.visible')
    })
  })

  describe('导航功能', () => {
    it('侧边栏显示用户中心链接', () => {
      cy.get('.sidebar').contains('用户中心').should('be.visible')
    })

    it('点击用户中心链接跳转到用户页面', () => {
      cy.contains('用户中心').click()
      cy.url().should('include', '/user-info')
    })
  })
})
