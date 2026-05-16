/// <reference types="cypress" />

describe('用户认证页面', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.visit('/user-info', { timeout: 60000 })
  })

  it('默认展示登录表单，并可切换到注册表单', () => {
    cy.contains('.el-tabs__item.is-active', '登录').should('be.visible')
    cy.contains('.setting-label', '邮箱').should('be.visible')
    cy.contains('.setting-label', '密码').should('be.visible')
    cy.contains('button', '登录').should('be.visible')

    cy.contains('.el-tabs__item', '注册').click()
    cy.contains('.el-tabs__item.is-active', '注册').should('be.visible')
    cy.contains('.setting-label', '验证码').should('be.visible')
    cy.contains('button', '发送验证码').should('exist')
    cy.contains('button', '注册').should('exist')
  })

  it('未登录访问首页会被路由守卫带回用户页', () => {
    cy.visit('/', { timeout: 60000 })
    cy.location('pathname').should('eq', '/user-info')
    cy.contains('.el-tabs__item.is-active', '登录').should('be.visible')
  })
})
