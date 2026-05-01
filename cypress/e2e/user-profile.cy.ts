/// <reference types="cypress" />

describe('用户信息管理测试', () => {
  beforeEach(() => {
    cy.visit('/user-info', { timeout: 60000 })
    cy.intercept('https://www.gravatar.com/**', { statusCode: 200, body: '', headers: { 'Content-Type': 'image/png' } })
  })

  describe('登录/注册界面', () => {
    it('显示登录和注册标签页', () => {
      cy.contains('登录').should('be.visible')
      cy.contains('注册').should('be.visible')
    })

    it('可以切换到注册标签页', () => {
      cy.contains('注册').click()
      cy.get('.el-tabs__item').contains('注册').should('have.class', 'is-active')
    })
  })

  describe('已登录用户功能', () => {
    beforeEach(() => {
      cy.get('input[placeholder="example@mail.com"]').first().clear().type('test@mail.com')
      cy.get('input[type="password"]').first().clear().type('password123')
      cy.contains('button', '登录').click()
      cy.contains('testuser', { timeout: 10000 }).should('be.visible')
    })

    it('显示用户头像', () => {
      cy.get('.avatar-img').should('be.visible')
    })

    it('显示用户名', () => {
      cy.contains('testuser').should('be.visible')
    })

    it('显示退出登录按钮', () => {
      cy.contains('退出登录').should('be.visible')
    })
  })

  describe('退出登录功能', () => {
    beforeEach(() => {
      cy.get('input[placeholder="example@mail.com"]').first().clear().type('test@mail.com')
      cy.get('input[type="password"]').first().clear().type('password123')
      cy.contains('button', '登录').click()
      cy.contains('testuser', { timeout: 10000 }).should('be.visible')
    })

    it('点击退出登录返回到登录表单', () => {
      cy.contains('退出登录').click()
      cy.contains('登录').should('be.visible')
      cy.contains('注册').should('be.visible')
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
  })

  describe('侧边栏用户展示同步', () => {
    it('未登录时侧边栏显示未登录', () => {
      cy.get('.sidebar').contains('未登录').should('be.visible')
    })

    it('登录后侧边栏显示用户信息', () => {
      cy.get('input[placeholder="example@mail.com"]').first().clear().type('test@mail.com')
      cy.get('input[type="password"]').first().clear().type('password123')
      cy.contains('button', '登录').click()
      cy.get('.sidebar').contains('testuser', { timeout: 10000 }).should('be.visible')
    })

    it('退出登录后侧边栏恢复默认显示', () => {
      cy.get('input[placeholder="example@mail.com"]').first().clear().type('test@mail.com')
      cy.get('input[type="password"]').first().clear().type('password123')
      cy.contains('button', '登录').click()
      cy.contains('testuser', { timeout: 10000 }).should('be.visible')
      cy.contains('退出登录').click()
      cy.get('.sidebar').contains('未登录').should('be.visible')
    })
  })
})
