import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../request'
import { marketApi, resolveDeveloperAvatar } from '../market'
import { AUTH_TOKEN_STORAGE_KEY } from '../../utils/storageNamespace'

vi.mock('../request', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('../config', () => ({
  getApiUrl: (endpoint: string) => `http://test${endpoint}`,
  shouldUseMarketMockApi: () => false,
}))

describe('marketApi', () => {
  const fetchMock = vi.fn()
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    window.sessionStorage.clear()
    window.localStorage.clear()
  })

  afterAll(() => {
    globalThis.fetch = originalFetch
  })

  it('lists published rules through the real backend endpoint with encoded filters', async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })

    await marketApi.listPublishedRules({ keyword: 'War & Duel', type: '对战' })

    expect(apiGet).toHaveBeenCalledWith(
      '/api/rules/published?keyword=War+%26+Duel&type=%E5%AF%B9%E6%88%98',
      expect.objectContaining({ useMock: false }),
    )
  })

  it('loads detail, developer rules, rooms, reviews, and fork endpoints with encoded ids', async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })
    vi.mocked(apiPost).mockResolvedValue({ success: true, data: {} })

    await marketApi.getPublishedRuleDetail('rule/with space')
    await marketApi.listDeveloperRules('dev/with space', { keyword: 'Tiny Demo' })
    await marketApi.listRuleRooms('rule/with space')
    await marketApi.postRuleReview('rule/with space', { rating: 5, content: 'Nice' })
    await marketApi.forkRule('rule/with space', 'My Fork')

    expect(apiGet).toHaveBeenNthCalledWith(
      1,
      '/api/rules/published/rule%2Fwith%20space',
      expect.objectContaining({ useMock: false }),
    )
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      '/api/rules/developers/dev%2Fwith%20space/rules?keyword=Tiny+Demo',
      expect.objectContaining({ useMock: false }),
    )
    expect(apiGet).toHaveBeenNthCalledWith(
      3,
      '/api/rules/published/rule%2Fwith%20space/rooms',
      expect.objectContaining({ useMock: false }),
    )
    expect(apiPost).toHaveBeenNthCalledWith(
      1,
      '/api/rules/published/rule%2Fwith%20space/reviews',
      { rating: 5, content: 'Nice' },
      expect.objectContaining({ useMock: false }),
    )
    expect(apiPost).toHaveBeenNthCalledWith(
      2,
      '/api/rules/published/rule%2Fwith%20space/fork',
      { name: 'My Fork' },
      expect.objectContaining({ useMock: false }),
    )
  })

  it('uploads review images as multipart with the current auth token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true, data: { imageUrl: '/static/review-images/r1.png' } }),
    })
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token-123')
    const file = new File(['image-bytes'], 'review.png', { type: 'image/png' })

    const result = await marketApi.uploadReviewImage(file)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://test/api/rules/reviews/images')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('include')
    expect(init.headers).toEqual({ Authorization: 'Bearer token-123' })
    expect(init.body).toBeInstanceOf(FormData)
    expect(result).toEqual({ success: true, data: { imageUrl: '/static/review-images/r1.png' } })
  })

  it('returns backend upload errors without synthesizing an image URL', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: '仅支持 png / jpeg / webp 格式' }),
    })
    const file = new File(['bad'], 'review.gif', { type: 'image/gif' })

    const result = await marketApi.uploadReviewImage(file)

    expect(result.success).toBe(false)
    expect(result.message).toBe('仅支持 png / jpeg / webp 格式')
  })
})

describe('resolveDeveloperAvatar', () => {
  it('keeps explicit developer avatars', () => {
    expect(resolveDeveloperAvatar({ id: 'dev-1', avatar: '/avatar.png' })).toBe('/avatar.png')
  })

  it('uses the WildCard logo for the system developer and the default avatar otherwise', () => {
    const systemAvatar = resolveDeveloperAvatar({ id: 'system', avatar: '' })
    const regularAvatar = resolveDeveloperAvatar({ id: 'dev-1', avatar: '' })

    expect(systemAvatar).toBeTruthy()
    expect(regularAvatar).toBeTruthy()
    expect(systemAvatar).not.toBe(regularAvatar)
  })
})
