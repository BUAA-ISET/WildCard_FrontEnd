/// <reference types="cypress" />

import { apiResponse, testUser, visitAs } from './helpers'

const loginUser = {
  ...testUser,
  id: '1',
  username: 'testuser',
  email: 'test@mail.com',
  token: 'test-token-login',
}

function stubLoggedOutApis() {
  cy.intercept('GET', /\/api\/user\/current$/, apiResponse({ success: false, message: '未登录' })).as('getCurrentUser')
  cy.intercept('POST', /\/api\/user\/login$/, apiResponse({ success: true, data: loginUser })).as('login')
  cy.intercept('POST', /\/api\/user\/logout$/, apiResponse({ success: true })).as('logout')
}

function loginThroughForm() {
  cy.get('input[placeholder="邮箱或用户名"]:visible').clear().type('test@mail.com')
  cy.get('input[type="password"]:visible').clear().type('password123')
  cy.contains('button', '登录').click()
  cy.wait('@login')
  cy.contains('testuser', { timeout: 10000 }).should('be.visible')
}

describe('用户信息管理测试', () => {
  beforeEach(() => {
    stubLoggedOutApis()
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
      loginThroughForm()
    })

    it('显示用户头像', () => {
      cy.get('.avatar-img').should('be.visible')
    })

    it('显示用户名', () => {
      cy.contains('testuser').should('be.visible')
    })

    it('显示退出登录按钮', () => {
      cy.contains('退出登录').scrollIntoView().should('be.visible')
    })
  })

  describe('退出登录功能', () => {
    beforeEach(() => {
      loginThroughForm()
    })

    it('点击退出登录返回到登录表单', () => {
      cy.contains('退出登录').click()
      cy.wait('@logout')
      cy.contains('登录').should('be.visible')
      cy.contains('注册').should('be.visible')
    })
  })

  describe('首页入口测试', () => {
    it('首页显示CREATE ROOM按钮', () => {
      visitAs('/')
      cy.contains('button', '创建房间').should('be.visible')
    })

    it('首页显示JOIN ROOM按钮', () => {
      visitAs('/')
      cy.contains('button', '加入房间').should('be.visible')
    })

    it('点击CREATE ROOM跳转到创建房间页面', () => {
      visitAs('/')
      cy.contains('button', '创建房间').click()
      cy.url().should('include', '/create-room')
    })
  })

  describe('侧边栏用户展示同步', () => {
    it('未登录时显示登录表单', () => {
      cy.contains('登录').should('be.visible')
      cy.contains('注册').should('be.visible')
    })

    it('登录后侧边栏显示用户信息', () => {
      loginThroughForm()
      cy.get('.sidebar').contains('testuser', { timeout: 10000 }).should('be.visible')
    })

    it('退出登录后返回登录表单', () => {
      loginThroughForm()
      cy.contains('退出登录').click()
      cy.wait('@logout')
      cy.contains('登录').should('be.visible')
      cy.contains('注册').should('be.visible')
    })
  })
})
