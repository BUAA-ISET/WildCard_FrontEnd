import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { USER_STORAGE_KEY, scopedStorageKey } from '../../utils/storageNamespace'
import { buildRoomHeaders, getRoomEntryPath, roomApi } from '../room'

const originalFetch = globalThis.fetch

const mockRoom = {
  id: 'room-id-001',
  code: 'ROOM01',
  host_id: 'user-001',
  player_count: 2,
  round_time: 45,
  rule_id: 'rule-001',
  rule_name: 'Tiny Demo',
  has_password: true,
  players: [
    {
      id: 'user-001',
      username: 'alice',
      avatar: '',
      is_ready: true,
      joined_at: 1000,
    },
  ],
  status: 'waiting',
  game_session_id: 'game-001',
}

describe('roomApi', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('normalizes backend rule options from snake_case fields', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        data: [{ id: 'rule-001', name: 'Tiny Demo', player_count: 2, description: 'demo rule' }],
      })),
    )

    const result = await roomApi.getRuleOptions()

    expect(result).toEqual({
      success: true,
      data: [{ id: 'rule-001', name: 'Tiny Demo', playerCount: 2, description: 'demo rule' }],
      message: undefined,
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/room/rules'),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('normalizes create room responses and stores the current room code', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: mockRoom })),
    )

    const result = await roomApi.createRoom({ ruleId: 'rule-001', roundTime: 45, password: 'pw' })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      id: 'room-id-001',
      code: 'ROOM01',
      hostId: 'user-001',
      playerCount: 2,
      roundTime: 45,
      ruleId: 'rule-001',
      ruleName: 'Tiny Demo',
      hasPassword: true,
      gameSessionId: 'game-001',
      players: [{ id: 'user-001', username: 'alice', isReady: true, joinedAt: 1000 }],
    })
    expect(window.sessionStorage.getItem(scopedStorageKey('current-room-code'))).toBe('ROOM01')
    expect(window.sessionStorage.getItem('currentRoomCode')).toBe('ROOM01')
  })

  it('uppercases room codes before joining a room', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: mockRoom })),
    )
    globalThis.fetch = fetchMock

    await roomApi.joinRoom({ code: ' room01 ', password: 'pw' })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      code: 'ROOM01',
      password: 'pw',
    })
  })

  it('does not store the current room code when joining fails', async () => {
    window.sessionStorage.setItem(scopedStorageKey('current-room-code'), 'OLD01')
    window.sessionStorage.setItem('currentRoomCode', 'OLD01')
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: '密码错误' }), { status: 403 }),
    )

    await expect(roomApi.joinRoom({ code: 'room01', password: 'wrong' })).resolves.toEqual({
      success: false,
      data: undefined,
      message: '密码错误',
    })

    expect(window.sessionStorage.getItem(scopedStorageKey('current-room-code'))).toBe('OLD01')
    expect(window.sessionStorage.getItem('currentRoomCode')).toBe('OLD01')
  })

  it('clears current room storage when leaving succeeds', async () => {
    window.sessionStorage.setItem(scopedStorageKey('current-room-code'), 'ROOM01')
    window.sessionStorage.setItem('currentRoomCode', 'ROOM01')
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })))

    await expect(roomApi.leaveRoom()).resolves.toEqual({ success: true })

    expect(window.sessionStorage.getItem(scopedStorageKey('current-room-code'))).toBeNull()
    expect(window.sessionStorage.getItem('currentRoomCode')).toBeNull()
  })

  it('builds player headers from cached signed-in user data', () => {
    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      id: 'user-001',
      username: '测试用户',
      email: 'user@example.com',
      avatar: '/avatar.png',
    }))

    expect(buildRoomHeaders()).toEqual({
      'x-player-id': 'user-001',
      'x-player-name': encodeURIComponent('测试用户'),
      'x-player-avatar': encodeURIComponent('/avatar.png'),
    })
  })

  it('returns battle entry paths for playing rooms and lobby paths otherwise', () => {
    expect(getRoomEntryPath({ code: 'ROOM 01', status: 'playing' })).toBe('/game/ROOM%2001/battle')
    expect(getRoomEntryPath({ code: 'ROOM 01', status: 'waiting' })).toBe('/game/ROOM%2001')
  })

  it('clears current room storage when no active backend room exists', async () => {
    window.sessionStorage.setItem(scopedStorageKey('current-room-code'), 'ROOM01')
    window.sessionStorage.setItem('currentRoomCode', 'ROOM01')
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: null })),
    )

    await expect(roomApi.getCurrentRoom()).resolves.toEqual({ success: true, data: null })

    expect(window.sessionStorage.getItem(scopedStorageKey('current-room-code'))).toBeNull()
    expect(window.sessionStorage.getItem('currentRoomCode')).toBeNull()
  })

  it('requests room rules with encoded room ids and returns rule data', async () => {
    const roomRule = {
      room_id: 'room 01',
      rule: { name: 'Tiny Demo', player_count: 2 },
    }
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: roomRule })),
    )

    await expect(roomApi.getRoomRule('room 01')).resolves.toEqual({
      success: true,
      data: roomRule,
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/room/rule/get?room_id=room%2001'),
      expect.objectContaining({ method: 'GET' }),
    )
  })
})
