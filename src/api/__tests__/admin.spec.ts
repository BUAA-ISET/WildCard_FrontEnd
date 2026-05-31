import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../request'
import { adminApi } from '../admin'

vi.mock('../request', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('listPending 走 GET /api/admin/rules/pending，并返回 BE 数组', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      success: true,
      data: [
        {
          draftId: 'd1',
          name: '示例规则',
          ownerId: 'u1',
          ownerName: 'Alice',
          playerCount: 2,
          description: '',
          updatedAt: 1700000000000,
          design: { nodes: [] },
        },
      ],
    })

    const result = await adminApi.listPending()

    expect(apiGet).toHaveBeenCalledWith('/api/admin/rules/pending', { useMock: false })
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0]?.draftId).toBe('d1')
  })

  it('approve 走 POST /api/admin/rules/{id}/approve，并对 draftId 编码', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      success: true,
      data: { ruleId: 'r-1', version: 1, status: 'published' },
    })

    const result = await adminApi.approve('draft/with space')

    expect(apiPost).toHaveBeenCalledWith(
      '/api/admin/rules/draft%2Fwith%20space/approve',
      {},
      { useMock: false },
    )
    expect(result.success).toBe(true)
    expect(result.data?.ruleId).toBe('r-1')
  })

  it('reject 走 POST /api/admin/rules/{id}/reject，body 携带 reason', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      success: true,
      data: { id: 'd1', status: 'rejected', updatedAt: 1 },
    })

    const result = await adminApi.reject('d1', '描述不清')

    expect(apiPost).toHaveBeenCalledWith(
      '/api/admin/rules/d1/reject',
      { reason: '描述不清' },
      { useMock: false },
    )
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('rejected')
  })

  it('getDraft 走 GET /api/admin/rules/drafts/{id}，并返回完整草稿', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      success: true,
      data: {
        id: 'd-preview',
        name: '示例规则',
        playerCount: 2,
        description: '简介',
        status: 'pendingReview',
        updatedAt: 1700000000000,
        createdAt: 1699999999000,
        ownerId: 'u-1',
        design: { classes: {}, cardsets: {}, cardset_comparisons: {}, match_flow: {}, end_flow: {} },
      },
    })

    const result = await adminApi.getDraft('d-preview')

    expect(apiGet).toHaveBeenCalledWith('/api/admin/rules/drafts/d-preview', { useMock: false })
    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('d-preview')
    expect(result.data?.design).toBeDefined()
  })

  it('getDraft 对包含特殊字符的 draftId 做 URL 编码', async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: undefined as never })

    await adminApi.getDraft('draft/with space')

    expect(apiGet).toHaveBeenCalledWith(
      '/api/admin/rules/drafts/draft%2Fwith%20space',
      { useMock: false },
    )
  })
})
