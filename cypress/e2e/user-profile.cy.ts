/// <reference types="cypress" />

describe('用户信息管理测试', () => {
  beforeEach(() => {
    cy.visit('/user-info', { timeout: 60000 })
  })

  describe('登录/注册界面', () => {
    it('显示登录和注册标签页', () => {
      cy.contains('登录').should('be.visible')
      cy.contains('注册').should('be.visible')
    })

    it('登录表单显示邮箱和密码输入框', () => {
      cy.get('input[type="password"]').should('exist')
    })

    it('可以切换到注册标签页', () => {
      cy.contains('注册').click()
      cy.get('.el-tabs__item').contains('注册').should('have.class', 'is-active')
    })
  })

  describe('首页入口测试', () => {
    it('首页显示CREATE ROOM按钮', () => {
      cy.visit('/', { timeout: 60000 })
      cy.contains('button', 'CREATE ROOM').should('be.visible')
    })

    it('首页显示JOIN ROOM按钮', () => {
      cy.visit('/', { timeout: 60000 })
      cy.contains('button', 'JOIN ROOM').should('be.visible')
    })

    it('点击CREATE ROOM跳转到创建房间页面', () => {
      cy.visit('/', { timeout: 60000 })
      cy.contains('button', 'CREATE ROOM').click()
      cy.url().should('include', '/create-room')
    })

    it('点击JOIN ROOM跳转到加入房间页面', () => {
      cy.visit('/', { timeout: 60000 })
      cy.contains('button', 'JOIN ROOM').click()
      cy.url().should('include', '/join-room')
    })
  })
})
