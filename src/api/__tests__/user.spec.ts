import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../../utils/storageNamespace'
import { userApi } from '../user'

const originalFetch = globalThis.fetch

describe('userApi', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('maps login requests and stores normalized backend user data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        data: {
          id: 'user-001',
          username: 'alice',
          email: 'alice@example.com',
          token: 'jwt-token',
        },
      })),
    )
    globalThis.fetch = fetchMock

    const result = await userApi.login({ email: 'alice@example.com', password: 'secret' })

    expect(result).toEqual({
      success: true,
      data: {
        id: 'user-001',
        username: 'alice',
        email: 'alice@example.com',
        avatar: '',
        token: 'jwt-token',
      },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/login'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ email: 'alice@example.com', password: 'secret' }),
      }),
    )
    expect(JSON.parse(window.sessionStorage.getItem(USER_STORAGE_KEY) || '{}')).toMatchObject({
      id: 'user-001',
      username: 'alice',
      avatar: '',
    })
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('jwt-token')
  })

  it('maps registration requests without attaching an existing bearer token', async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'old-token')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        data: {
          id: 'user-002',
          username: 'bob',
          email: 'bob@example.com',
          avatar: '/avatar.png',
          token: 'new-token',
        },
      })),
    )
    globalThis.fetch = fetchMock

    await userApi.register({
      email: 'bob@example.com',
      username: 'bob',
      password: 'password123',
      verificationCode: '123456',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/register'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'bob@example.com',
          username: 'bob',
          password: 'password123',
          verificationCode: '123456',
        }),
      }),
    )
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('new-token')
  })

  it('does not store user or token data when login fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: '邮箱或密码错误' }), { status: 401 }),
    )

    await expect(userApi.login({ email: 'alice@example.com', password: 'wrong' })).resolves.toEqual({
      success: false,
      message: '邮箱或密码错误',
    })

    expect(window.sessionStorage.getItem(USER_STORAGE_KEY)).toBeNull()
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('does not overwrite cached user data when registration fails', async () => {
    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      id: 'cached-user',
      username: 'cached',
      email: 'cached@example.com',
      avatar: '',
    }))
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'cached-token')
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: '验证码错误' }), { status: 422 }),
    )

    await expect(userApi.register({
      email: 'new@example.com',
      username: 'new-user',
      password: 'password123',
      verificationCode: '000000',
    })).resolves.toEqual({
      success: false,
      message: '验证码错误',
    })

    expect(JSON.parse(window.sessionStorage.getItem(USER_STORAGE_KEY) || '{}')).toMatchObject({
      id: 'cached-user',
      username: 'cached',
    })
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('cached-token')
  })

  it('does not overwrite the cached user when current user lookup fails', async () => {
    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      id: 'cached-user',
      username: 'cached',
      email: 'cached@example.com',
      avatar: '',
    }))
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'unauthorized' }), { status: 401 }),
    )

    await expect(userApi.getCurrentUser()).resolves.toEqual({
      success: false,
      message: 'unauthorized',
    })
    expect(JSON.parse(window.sessionStorage.getItem(USER_STORAGE_KEY) || '{}')).toMatchObject({
      id: 'cached-user',
      username: 'cached',
    })
  })

  it('maps verification code, username, and password update requests', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () => Promise.resolve(new Response(JSON.stringify({ success: true }))),
    )
    globalThis.fetch = fetchMock

    await userApi.sendVerificationCode({ email: 'new@example.com' })
    await userApi.updateUsername('new-name')
    await userApi.updatePassword({ currentPassword: 'old-pass', newPassword: 'new-pass' })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/user/send-code'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'new@example.com' }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/user/username'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ username: 'new-name' }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/api/user/password'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ currentPassword: 'old-pass', newPassword: 'new-pass' }),
      }),
    )
  })
})
