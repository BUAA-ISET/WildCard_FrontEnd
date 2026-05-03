/// <reference types="cypress" />

describe('ReadyRoomView 房间准备页面测试', () => {
  beforeEach(() => {
    cy.intercept('https://www.gravatar.com/**', { statusCode: 200, body: '', headers: { 'Content-Type': 'image/png' } })
  })

  describe('创建房间后进入准备页面', () => {
    it('显示房间准备页面', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('h1', 'Create Room').should('be.visible')
      cy.contains('Room Settings').should('be.visible')
      cy.contains('Classic Rules (4 players)').should('be.visible')
      cy.contains('button', 'Create Room').click()
      cy.location('pathname').should('match', /^\/game\/[A-Z0-9]{6}$/)
      cy.contains('.ready-room-page').should('be.visible')
    })

    it('显示房间号', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      cy.location('pathname').then((pathname) => {
        const roomCode = pathname.match(/^\/game\/([A-Z0-9]{6})$/)?.[1]
        expect(roomCode).to.match(/^[A-Z0-9]{6}$/)
        cy.contains('.room-summary', roomCode).should('be.visible')
      })
    })

    it('显示房间信息摘要（规则名称、玩家人数、回合时长）', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      cy.contains('.room-summary').within(() => {
        cy.contains('房间号').should('be.visible')
        cy.contains('游戏规则').should('be.visible')
        cy.contains('Classic Rules').should('be.visible')
        cy.contains('玩家人数').should('be.visible')
        cy.contains('回合时长').should('be.visible')
      })
    })

    it('显示当前用户为房主', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      cy.contains('.room-eyebrow', 'Ready Room').should('be.visible')
    })

    it('显示玩家网格', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      cy.contains('.players-grid').should('be.visible')
    })

    it('显示玩家用户名', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      cy.window().then((win) => {
        const username = win.sessionStorage.getItem('username')
        cy.contains('.player-name', username || 'User').should('be.visible')
      })
    })

    it('显示房主标签', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      cy.contains('.player-status', '房主').should('be.visible')
    })

    it('显示准备状态', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      cy.contains('.player-status').should('contain', '房主')
    })
  })

  describe('操作按钮', () => {
    it('房主显示开始游戏按钮（未满员时禁用）', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      const startButton = cy.contains('.primary-btn', '开始游戏')
      startButton.should('be.visible')
      startButton.should('be.disabled')
    })

    it('显示离开房间按钮', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      cy.contains('.danger-btn', '离开房间').should('be.visible')
    })

    it('点击离开房间按钮返回首页', () => {
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('button', 'Create Room').click()
      cy.contains('.danger-btn', '离开房间').click()
      cy.url().should('not.include', '/game/')
    })
  })

  describe('加入房间后进入准备页面', () => {
    it('加入房间后显示准备/取消准备按钮', () => {
      cy.visit('/join-room', { timeout: 60000 })
      cy.get('.join-room-input input').type('123456')
      cy.contains('button', '加入房间').click()
      cy.location('pathname').should('eq', '/game/123456')
      cy.contains('.secondary-btn', '准备').should('be.visible')
    })
  })
})