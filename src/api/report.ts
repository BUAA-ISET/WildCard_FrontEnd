import { apiGet, apiPost } from './request'
import { scopedStorageKey } from '../utils/storageNamespace'

export type ReportTargetType = 'user' | 'rule' | 'review' | 'player_behavior'
export type ReportStatus = 'pending' | 'resolved' | 'rejected'
export type ReportAction = 'ban_user' | 'ban_rule' | 'dismiss'

export interface ReportContext {
  targetLabel?: string
  roomCode?: string
  sessionId?: string
  ruleId?: string
  sourcePath?: string
  snapshot?: Record<string, unknown>
}

export interface Report {
  id: string
  reporterId: string
  reporterName: string
  reporterAvatar?: string
  targetType: ReportTargetType
  targetId: string
  reason: string
  details: string
  status: ReportStatus
  createdAt: number
  updatedAt: number
  context?: ReportContext
  actionLog?: ReportActionLog[]
}

export interface ReportActionLog {
  id: string
  action: ReportAction
  operatorId: string
  note: string
  createdAt: number
}

export interface SubmitReportPayload {
  reporterId: string
  reporterName: string
  reporterAvatar?: string
  targetType: ReportTargetType
  targetId: string
  reason: string
  details: string
  context?: ReportContext
}

export interface ReportQuery {
  status?: ReportStatus | 'all'
  targetType?: ReportTargetType | 'all'
  keyword?: string
  page?: number
}

export interface ReportActionPayload {
  action: ReportAction
  note?: string
  params?: Record<string, unknown>
}

interface ApiResult<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

const REPORT_STORAGE_KEY = scopedStorageKey('mock-reports')

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readLocalReports(): Report[] {
  if (!hasStorage()) return []
  const raw = window.localStorage.getItem(REPORT_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalReports(reports: Report[]) {
  if (!hasStorage()) return
  window.localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports))
}

function createLocalReport(payload: SubmitReportPayload): Report {
  const now = Date.now()
  return {
    id: `report-${now}-${Math.random().toString(36).slice(2, 8)}`,
    reporterId: payload.reporterId,
    reporterName: payload.reporterName,
    reporterAvatar: payload.reporterAvatar,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    details: payload.details,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    context: payload.context,
  }
}

function queryString(params: ReportQuery = {}) {
  const searchParams = new URLSearchParams()
  if (params.status && params.status !== 'all') searchParams.set('status', params.status)
  if (params.targetType && params.targetType !== 'all') searchParams.set('targetType', params.targetType)
  if (params.keyword) searchParams.set('keyword', params.keyword)
  if (params.page) searchParams.set('page', String(params.page))
  const value = searchParams.toString()
  return value ? `?${value}` : ''
}

function filterLocalReports(params: ReportQuery = {}) {
  const keyword = params.keyword?.trim().toLowerCase()
  return readLocalReports()
    .filter((report) => params.status === 'all' || !params.status || report.status === params.status)
    .filter((report) => params.targetType === 'all' || !params.targetType || report.targetType === params.targetType)
    .filter((report) => {
      if (!keyword) return true
      return [
        report.targetId,
        report.reason,
        report.details,
        report.context?.targetLabel,
        report.reporterName,
      ].some((item) => String(item || '').toLowerCase().includes(keyword))
    })
    .sort((left, right) => right.createdAt - left.createdAt)
}

function saveLocalAction(reportId: string, payload: ReportActionPayload): ApiResult<Report> {
  const reports = readLocalReports()
  const report = reports.find((item) => item.id === reportId)
  if (!report) {
    return { success: false, message: '举报记录不存在' }
  }

  const now = Date.now()
  report.status = payload.action === 'dismiss' ? 'rejected' : 'resolved'
  report.updatedAt = now
  report.actionLog = [
    ...(report.actionLog || []),
    {
      id: `action-${now}`,
      action: payload.action,
      operatorId: 'admin',
      note: payload.note || '',
      createdAt: now,
    },
  ]
  writeLocalReports(reports)
  return { success: true, data: report }
}

export const reportApi = {
  async submit(payload: SubmitReportPayload): Promise<ApiResult<Report>> {
    const result = await apiPost<ApiResult<Report>>('/api/reports', payload, { useMock: false })
    if (result.success) {
      return result
    }

    const report = createLocalReport(payload)
    const reports = readLocalReports()
    writeLocalReports([report, ...reports])
    return { success: true, data: report, message: '已保存到本地模拟举报列表' }
  },

  async list(params: ReportQuery = {}): Promise<ApiResult<Report[]>> {
    const result = await apiGet<ApiResult<Report[]>>(`/api/reports${queryString(params)}`, { useMock: false })
    if (result.success && Array.isArray(result.data)) {
      return result
    }

    return { success: true, data: filterLocalReports(params) }
  },

  async get(id: string): Promise<ApiResult<Report>> {
    const result = await apiGet<ApiResult<Report>>(`/api/reports/${encodeURIComponent(id)}`, { useMock: false })
    if (result.success && result.data) {
      return result
    }

    const report = readLocalReports().find((item) => item.id === id)
    return report ? { success: true, data: report } : { success: false, message: '举报记录不存在' }
  },

  async counts(): Promise<ApiResult<{ pending: number }>> {
    const result = await apiGet<ApiResult<{ pending: number }>>('/api/reports/counts', { useMock: false })
    if (result.success && result.data) {
      return result
    }

    return {
      success: true,
      data: { pending: readLocalReports().filter((report) => report.status === 'pending').length },
    }
  },

  async action(reportId: string, payload: ReportActionPayload): Promise<ApiResult<Report>> {
    const result = await apiPost<ApiResult<Report>>(
      `/api/reports/${encodeURIComponent(reportId)}/action`,
      payload,
      { useMock: false },
    )
    if (result.success) {
      return result
    }

    return saveLocalAction(reportId, payload)
  },
}
