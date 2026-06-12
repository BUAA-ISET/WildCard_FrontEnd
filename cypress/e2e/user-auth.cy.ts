/// <reference types="cypress" />

import { apiResponse, testUser, visitAs } from './helpers'

const loginUser = {
  ...testUser,
  id: '1',
  username: 'testuser',
  email: 'test@mail.com',
  token: 'test-token-login',
}

describe('用户认证测试', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.intercept('https://www.gravatar.com/**', { statusCode: 200, body: '', headers: { 'Content-Type': 'image/png' } })
    cy.intercept('GET', /\/api\/user\/current$/, apiResponse({ success: false, message: '未登录' })).as('getCurrentUser')
    cy.intercept('POST', /\/api\/user\/login$/, apiResponse({ success: true, data: loginUser })).as('login')
    cy.intercept('POST', /\/api\/user\/send-code$/, apiResponse({ success: true, message: '验证码已发送，请检查邮箱' })).as('sendCode')
    cy.visit('/user-info', { timeout: 60000 })
  })

  afterEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
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
  })

  describe('Mock模式登录功能', () => {
    it('使用mock账户登录成功', () => {
      cy.get('input[placeholder="邮箱或用户名"]:visible').clear().type('test@mail.com')
      cy.get('input[type="password"]:visible').clear().type('password123')
      cy.contains('button', '登录').click()
      cy.wait('@login')
      cy.contains('testuser', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('注册和验证码功能', () => {
    it('显示验证码发送按钮', () => {
      cy.contains('注册').click()
      cy.contains('发送验证码').should('be.visible')
    })

    it('未输入邮箱不能发送验证码', () => {
      cy.contains('注册').click()
      cy.contains('发送验证码').click()
      cy.contains('请先输入邮箱').should('be.visible')
    })

    it('可以发送验证码到有效邮箱', () => {
      cy.contains('注册').click()
      cy.get('input[placeholder="example@mail.com"]:visible').clear().type('newuser@mail.com')
      cy.contains('发送验证码').click()
      cy.wait('@sendCode')
      cy.contains('验证码已发送', { timeout: 5000 }).should('be.visible')
    })
  })

  describe('导航功能', () => {
    it('侧边栏显示用户中心链接', () => {
      visitAs('/user-info')
      cy.get('.sidebar').contains('用户中心').should('be.visible')
    })

    it('点击用户中心链接跳转到用户页面', () => {
      visitAs('/')
      cy.contains('用户中心').click()
      cy.url().should('include', '/user-info')
    })
  })
})
