/// <reference types="cypress" />

describe('ReadyRoomView 房间准备页面测试', () => {
  // 房间信息显示测试组
  describe('房间信息显示', () => {
    beforeEach(() => {
      // 清理状态
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // 创建房间
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('h1', 'Create Room', { timeout: 10000 }).should('be.visible')
      cy.contains('Room Settings', { timeout: 10000 }).should('be.visible')
      cy.contains('Classic Rules (4 players)', { timeout: 10000 }).should('be.visible')
      cy.contains('button', 'Create Room').should('be.enabled').click()
      
      // 等待跳转和页面加载
      cy.location('pathname', { timeout: 15000 }).should('match', /^\/game\/[A-Z0-9]{6}$/)
      cy.get('.room-eyebrow', { timeout: 10000 }).should('contain', 'Ready Room')
      cy.get('.room-summary', { timeout: 10000 }).should('be.visible')
      cy.get('.players-grid', { timeout: 10000 }).should('be.visible')
    })

    it('创建房间后显示完整的房间信息摘要', () => {
      cy.get('.room-summary').within(() => {
        cy.contains('.summary-label', '房间号').should('be.visible')
        cy.contains('.summary-label', '游戏规则').should('be.visible')
        cy.contains('.summary-label', '玩家人数').should('be.visible')
        cy.contains('.summary-label', '回合时长').should('be.visible')
      })
    })

    it('显示房间号和规则名称', () => {
      cy.get('.summary-value').contains('Classic Rules')
    })
  })

  // 玩家网格显示测试组
  describe('玩家网格显示', () => {
    beforeEach(() => {
      // 清理状态
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // 创建房间
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('h1', 'Create Room', { timeout: 10000 }).should('be.visible')
      cy.contains('Room Settings', { timeout: 10000 }).should('be.visible')
      cy.contains('Classic Rules (4 players)', { timeout: 10000 }).should('be.visible')
      cy.contains('button', 'Create Room').should('be.visible').click()
      
      // 等待跳转和页面加载
      cy.location('pathname', { timeout: 15000 }).should('match', /^\/game\/[A-Z0-9]{6}$/)
      cy.get('.room-eyebrow', { timeout: 10000 }).should('contain', 'Ready Room')
      cy.get('.room-summary', { timeout: 10000 }).should('be.visible')
      cy.get('.players-grid', { timeout: 10000 }).should('be.visible')
    })

    it('显示玩家网格', () => {
      cy.get('.players-grid').should('be.visible')
    })

    it('显示当前玩家为房主', () => {
      cy.get('.player-status').should('contain', '房主')
      cy.get('.player-name').should('be.visible')
    })

    it('显示空槽位表示未满员', () => {
      cy.get('.player-box.empty').should('have.length.greaterThan', 0)
    })
  })

  // 操作按钮显示测试组（房主场景）
  describe('操作按钮显示', () => {
    beforeEach(() => {
      // 清理状态
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // 创建房间
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('h1', 'Create Room', { timeout: 10000 }).should('be.visible')
      cy.contains('Room Settings', { timeout: 10000 }).should('be.visible')
      cy.contains('Classic Rules (4 players)', { timeout: 10000 }).should('be.visible')
      cy.contains('button', 'Create Room').should('be.visible').click()
      
      // 等待跳转和页面加载
      cy.location('pathname', { timeout: 15000 }).should('match', /^\/game\/[A-Z0-9]{6}$/)
      cy.get('.room-eyebrow', { timeout: 10000 }).should('contain', 'Ready Room')
      cy.get('.room-summary', { timeout: 10000 }).should('be.visible')
      cy.get('.players-grid', { timeout: 10000 }).should('be.visible')
    })

    it('房主显示开始游戏按钮', () => {
      cy.get('.primary-btn').should('contain', '开始游戏')
      cy.get('.primary-btn').should('be.disabled')
    })

    it('所有用户都能看到离开房间按钮', () => {
      cy.get('.danger-btn').should('contain', '离开房间')
    })
  })

  // 非房主场景测试组
  describe('非房主场景', () => {
    beforeEach(() => {
      // 清理状态
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // 注意：这里需要先创建一个房间，然后用另一个用户加入
      // 简化处理：直接加入一个已存在的测试房间
      cy.visit('/join-room', { timeout: 60000 })
      cy.get('.join-room-input input', { timeout: 10000 }).should('be.visible').type('123456')
      cy.contains('button', '加入房间').should('be.enabled').click()
      cy.contains('密码', { timeout: 10000 }).should('be.visible')
      cy.get('.join-room-input input').type('abc123')
      cy.contains('button', '加入房间').should('be.enabled').click()
      
      // 等待跳转和页面加载
      cy.location('pathname', { timeout: 15000 }).should('eq', '/game/123456')
      cy.get('.room-eyebrow', { timeout: 10000 }).should('contain', 'Ready Room')
      cy.get('.room-summary', { timeout: 10000 }).should('be.visible')
      cy.get('.players-grid', { timeout: 10000 }).should('be.visible')
    })

    it('非房主显示准备按钮而非开始游戏', () => {
      cy.get('.secondary-btn').should('contain', '准备')
      cy.get('.primary-btn').should('not.exist')
    })
  })

  // 离开房间功能测试组
  describe('离开房间功能', () => {
    beforeEach(() => {
      // 清理状态
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // 创建房间
      cy.visit('/create-room', { timeout: 60000 })
      cy.contains('h1', 'Create Room', { timeout: 10000 }).should('be.visible')
      cy.contains('Room Settings', { timeout: 10000 }).should('be.visible')
      cy.contains('Classic Rules (4 players)', { timeout: 10000 }).should('be.visible')
      cy.contains('button', 'Create Room').should('be.visible').click()
      
      // 等待跳转和页面加载
      cy.location('pathname', { timeout: 15000 }).should('match', /^\/game\/[A-Z0-9]{6}$/)
      cy.get('.room-eyebrow', { timeout: 10000 }).should('contain', 'Ready Room')
      cy.get('.room-summary', { timeout: 10000 }).should('be.visible')
      cy.get('.players-grid', { timeout: 10000 }).should('be.visible')
    })

    it('点击离开房间按钮返回首页', () => {
      cy.get('.danger-btn', {timeout: 10000}).should('be.enabled').click()
      
      // 处理可能的确认对话框
      cy.on('window:confirm', () => true)
      
      // 验证离开了房间页面
      cy.url({ timeout: 10000 }).should('not.include', '/game/')
    })
  })
})