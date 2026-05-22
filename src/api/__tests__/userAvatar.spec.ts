import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { USER_STORAGE_KEY } from '../../utils/storageNamespace'
import { userApi } from '../user'

const originalFetch = globalThis.fetch

describe('userApi avatar profile data', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('stores the avatar URL returned by a login response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        data: {
          id: 'user-001',
          username: 'alice',
          email: 'alice@example.com',
          avatar: '/static/avatars/alice.png',
          token: 'jwt-token',
        },
      })),
    )

    const result = await userApi.login({ email: 'alice@example.com', password: 'secret' })

    expect(result.success).toBe(true)
    expect(result.data?.avatar).toBe('/static/avatars/alice.png')
    expect(JSON.parse(window.sessionStorage.getItem(USER_STORAGE_KEY) || '{}')).toMatchObject({
      id: 'user-001',
      username: 'alice',
      avatar: '/static/avatars/alice.png',
    })
  })

  it('refreshes the cached avatar URL from the current-user response', async () => {
    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      id: 'user-001',
      username: 'alice',
      email: 'alice@example.com',
      avatar: '/static/avatars/old.png',
    }))
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        data: {
          id: 'user-001',
          username: 'alice',
          email: 'alice@example.com',
          avatar: '/static/avatars/new.png',
        },
      })),
    )

    const result = await userApi.getCurrentUser()

    expect(result.success).toBe(true)
    expect(result.data?.avatar).toBe('/static/avatars/new.png')
    expect(JSON.parse(window.sessionStorage.getItem(USER_STORAGE_KEY) || '{}')).toMatchObject({
      avatar: '/static/avatars/new.png',
    })
  })
})
