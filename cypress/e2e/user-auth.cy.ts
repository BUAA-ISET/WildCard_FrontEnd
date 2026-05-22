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

  it('登录成功后展示账户资料', () => {
    cy.intercept('POST', '**/api/user/login', {
      success: true,
      data: {
        id: 'user-001',
        username: 'alice',
        email: 'alice@example.com',
        avatar: '',
        token: 'jwt-token',
      },
    }).as('login')

    cy.get('input').eq(0).type('alice@example.com')
    cy.get('input').eq(1).type('password123')
    cy.contains('button', '登录').click()
    cy.wait('@login')

    cy.contains('.user-name', 'alice').should('be.visible')
    cy.contains('.user-email', 'alice@example.com').should('be.visible')
    cy.window().then((win) => {
      const sessionKeys = Array.from({ length: win.sessionStorage.length }, (_value, index) => win.sessionStorage.key(index))
        .filter((key): key is string => Boolean(key))
      const userKey = sessionKeys.find((key) => key.endsWith(':user'))
      const tokenKey = sessionKeys.find((key) => key.endsWith(':auth-token'))

      expect(userKey).to.be.a('string')
      expect(JSON.parse(win.sessionStorage.getItem(userKey || '') || '{}')).to.include({
        id: 'user-001',
        username: 'alice',
        email: 'alice@example.com',
      })
      expect(tokenKey).to.be.a('string')
      expect(win.sessionStorage.getItem(tokenKey || '')).to.eq('jwt-token')
    })
  })
})
