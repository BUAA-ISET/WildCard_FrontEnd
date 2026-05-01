/// <reference types="cypress" />

const visitOptions = {
  onLoad: () => {},
}

describe('用户信息管理测试（已登录状态）', () => {
  beforeEach(() => {
    cy.visit('/user-info', visitOptions)
    cy.contains('切换登录状态').click()
  })

  describe('用户信息显示', () => {
    it('显示用户头像', () => {
      cy.get('.avatar-img').should('be.visible')
    })

    it('显示用户名', () => {
      cy.contains('test@mail.com').should('be.visible')
    })

    it('显示用户名修改区域', () => {
      cy.contains('用户名').should('be.visible')
      cy.get('.setting-input').should('be.visible')
    })

    it('显示密码修改区域', () => {
      cy.contains('当前密码').should('be.visible')
      cy.contains('新密码').should('be.visible')
      cy.contains('确认新密码').should('be.visible')
    })

    it('显示退出登录按钮', () => {
      cy.contains('退出登录').should('be.visible')
    })
  })

  describe('退出登录功能', () => {
    it('点击退出登录返回到登录表单', () => {
      cy.contains('退出登录').click()
      cy.contains('登录').should('be.visible')
      cy.contains('注册').should('be.visible')
    })
  })

  describe('首页入口测试', () => {
    it('首页显示CREATE ROOM按钮', () => {
      cy.visit('/', visitOptions)
      cy.contains('button', 'CREATE ROOM').should('be.visible')
    })

    it('首页显示JOIN ROOM按钮', () => {
      cy.visit('/', visitOptions)
      cy.contains('button', 'JOIN ROOM').should('be.visible')
    })

    it('点击CREATE ROOM跳转到创建房间页面', () => {
      cy.visit('/', visitOptions)
      cy.contains('button', 'CREATE ROOM').click()
      cy.url().should('include', '/create-room')
    })

    it('点击JOIN ROOM跳转到加入房间页面', () => {
      cy.visit('/', visitOptions)
      cy.contains('button', 'JOIN ROOM').click()
      cy.url().should('include', '/join-room')
    })
  })
})
