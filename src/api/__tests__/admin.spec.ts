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
})
