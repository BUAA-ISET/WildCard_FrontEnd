import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_TOKEN_STORAGE_KEY } from '../../utils/storageNamespace'
import { apiGet, apiPost, apiRequest } from '../request'

const originalFetch = globalThis.fetch

describe('apiRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('returns mock data after the configured mock delay', async () => {
    const request = apiRequest<{ success: boolean; data: string }>('/api/mock', {
      useMock: true,
      mockDelay: 50,
      mockFn: () => ({ success: true, data: 'ready' }),
    })

    await vi.advanceTimersByTimeAsync(49)
    let settled = false
    request.then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await expect(request).resolves.toEqual({ success: true, data: 'ready' })
  })

  it('adds a bearer token from storage for authenticated requests', async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'session-token')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })))
    globalThis.fetch = fetchMock

    const result = await apiGet<{ ok: boolean }>('/api/user/current', { useMock: false })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/current'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('does not attach the bearer token to registration requests', async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'session-token')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })))
    globalThis.fetch = fetchMock

    await apiPost('/api/user/register', { email: 'user@example.com' }, { useMock: false })

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('normalizes non-ok JSON responses into failure objects', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'room not found' }), {
        status: 404,
      }),
    )

    await expect(apiGet('/api/room/current', { useMock: false })).resolves.toEqual({
      success: false,
      message: 'room not found',
    })
  })

  it('returns a failure object when fetch rejects', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('connection refused'))

    await expect(apiGet('/api/unavailable', { useMock: false })).resolves.toEqual({
      success: false,
      message: 'connection refused',
    })
  })
})
