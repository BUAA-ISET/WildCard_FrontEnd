import { beforeEach, describe, expect, it, vi, afterAll } from 'vitest'
import { apiPost } from '../request'
import { ruleApi } from '../rule'

vi.mock('../request', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}))

vi.mock('../config', () => ({
  getApiUrl: (endpoint: string) => `http://test${endpoint}`,
}))

describe('ruleApi.submitReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('提交审核接口走 POST /api/rules/drafts/{id}/submit-review', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      success: true,
      data: { id: 'draft-123', status: 'pendingReview', updatedAt: 1 },
    })

    const result = await ruleApi.submitReview('draft-123')

    expect(apiPost).toHaveBeenCalledWith(
      '/api/rules/drafts/draft-123/submit-review',
      {},
      { useMock: false },
    )
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('pendingReview')
  })

  it('对包含特殊字符的 draftId 做 URL 编码', async () => {
    vi.mocked(apiPost).mockResolvedValue({ success: true, data: { id: '', status: '', updatedAt: 0 } })

    await ruleApi.submitReview('draft/with space')

    expect(apiPost).toHaveBeenCalledWith(
      '/api/rules/drafts/draft%2Fwith%20space/submit-review',
      {},
      { useMock: false },
    )
  })
})

describe('ruleApi.saveRuleDesign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('一站式接口由 createDraft → submitReview 串联，不再调用 publishDraft', async () => {
    vi.mocked(apiPost)
      // createDraft
      .mockResolvedValueOnce({ success: true, data: { id: 'd1', updatedAt: 0 } })
      // submitReview
      .mockResolvedValueOnce({
        success: true,
        data: { id: 'd1', status: 'pendingReview', updatedAt: 1 },
      })

    const result = await ruleApi.saveRuleDesign({
      name: 'Demo',
      playerCount: 2,
      description: '',
      design: {} as never,
    })

    expect(apiPost).toHaveBeenCalledTimes(2)
    const secondCallUrl = vi.mocked(apiPost).mock.calls[1]?.[0] as string
    expect(secondCallUrl).toContain('/submit-review')
    expect(secondCallUrl).not.toContain('/publish')
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('pendingReview')
  })
})

describe('ruleApi.uploadRuleImage', () => {
  const fetchMock = vi.fn()
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterAll(() => {
    globalThis.fetch = originalFetch
  })

  it('multipart POST 到 /api/rules/drafts/{id}/images，并对 draftId 做编码', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true, data: { imageUrl: '/static/rule-images/xyz.png' } }),
    })
    const file = new File(['x'], 'cover.png', { type: 'image/png' })

    const result = await ruleApi.uploadRuleImage('draft id/1', file)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://test/api/rules/drafts/draft%20id%2F1/images')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    expect(result).toEqual({ success: true, data: { imageUrl: '/static/rule-images/xyz.png' } })
  })

  it('HTTP 非 2xx 时返回带 message 的失败结果', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 413,
      text: async () => JSON.stringify({ message: '图片过大' }),
    })
    const file = new File(['x'], 'cover.png', { type: 'image/png' })

    const result = await ruleApi.uploadRuleImage('d1', file)
    expect(result.success).toBe(false)
    expect(result.message).toBe('图片过大')
  })
})
