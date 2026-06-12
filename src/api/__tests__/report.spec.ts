import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../request'
import { reportApi, type Report } from '../report'

vi.mock('../request', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

const storageKey = 'wildcard:default:mock-reports'

const pendingReport: Report = {
  id: 'report-pending',
  reporterId: 'u-1',
  reporterName: 'Alice',
  targetType: 'player_behavior',
  targetId: 'room-42',
  reason: '恶意拖延',
  details: '最后一轮持续不操作',
  status: 'pending',
  createdAt: 1700000002000,
  updatedAt: 1700000002000,
  context: { targetLabel: '房间 42 的 Bob', sourcePath: '/battle/room-42' },
}

const resolvedReport: Report = {
  id: 'report-resolved',
  reporterId: 'u-2',
  reporterName: 'Carol',
  targetType: 'rule',
  targetId: 'rule-9',
  reason: '疑似抄袭',
  details: '规则描述高度相似',
  status: 'resolved',
  createdAt: 1700000001000,
  updatedAt: 1700000001000,
}

function seedLocalReports(reports: Report[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(reports))
}

describe('reportApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('lists reports through the backend with encoded filters and without all sentinels', async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })

    await reportApi.list({
      status: 'all',
      targetType: 'player_behavior',
      keyword: 'room 42 & Bob',
      page: 2,
    })

    expect(apiGet).toHaveBeenCalledWith(
      '/api/reports?targetType=player_behavior&keyword=room+42+%26+Bob&page=2',
      expect.objectContaining({ useMock: false }),
    )
  })

  it('falls back to local storage when submit backend is unavailable', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000003000)
    vi.spyOn(Math, 'random').mockReturnValue(0.123456)
    vi.mocked(apiPost).mockResolvedValue({ success: false, message: 'Not Found' })

    const result = await reportApi.submit({
      reporterId: 'spoofed-reporter',
      reporterName: 'Alice',
      reporterAvatar: '/avatar.png',
      targetType: 'rule',
      targetId: 'rule-1',
      reason: '违规素材',
      details: '封面包含不合规图片',
      context: { targetLabel: '规则 A', sourcePath: '/rule-market/rule-1' },
    })

    expect(apiPost).toHaveBeenCalledWith(
      '/api/reports',
      expect.objectContaining({ reporterId: 'spoofed-reporter', targetId: 'rule-1' }),
      expect.objectContaining({ useMock: false }),
    )
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      id: 'report-1700000003000-4fzyo8',
      status: 'pending',
      targetType: 'rule',
      targetId: 'rule-1',
    })
    expect(JSON.parse(window.localStorage.getItem(storageKey) || '[]')).toHaveLength(1)
  })

  it('filters and sorts local fallback reports by status, type, and keyword', async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: false })
    seedLocalReports([resolvedReport, pendingReport])

    const result = await reportApi.list({
      status: 'pending',
      targetType: 'player_behavior',
      keyword: 'bob',
    })

    expect(result).toEqual({ success: true, data: [pendingReport] })
  })

  it('uses local fallback for detail, counts, and action status mapping', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000004000)
    vi.mocked(apiGet).mockResolvedValue({ success: false })
    vi.mocked(apiPost).mockResolvedValue({ success: false })
    seedLocalReports([pendingReport, resolvedReport])

    await expect(reportApi.get('report-pending')).resolves.toEqual({ success: true, data: pendingReport })
    await expect(reportApi.counts()).resolves.toEqual({ success: true, data: { pending: 1 } })

    const dismissed = await reportApi.action('report-pending', {
      action: 'dismiss',
      note: '证据不足',
      params: { targetType: 'player_behavior', targetId: 'room-42' },
    })

    expect(apiPost).toHaveBeenCalledWith(
      '/api/reports/report-pending/action',
      expect.objectContaining({ action: 'dismiss' }),
      expect.objectContaining({ useMock: false }),
    )
    expect(dismissed.success).toBe(true)
    expect(dismissed.data).toMatchObject({
      status: 'rejected',
      updatedAt: 1700000004000,
      actionLog: [expect.objectContaining({ action: 'dismiss', operatorId: 'admin', note: '证据不足' })],
    })
    expect(JSON.parse(window.localStorage.getItem(storageKey) || '[]')[0].status).toBe('rejected')
  })
})
