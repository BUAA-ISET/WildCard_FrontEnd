import { apiGet, apiPost } from './request'
import { scopedStorageKey } from '../utils/storageNamespace'

export type ReportTargetType = 'user' | 'rule' | 'review' | 'player_behavior'
export type ReportStatus = 'pending' | 'resolved' | 'rejected'
export type ReportAction = 'ban_user' | 'ban_rule' | 'ban_both' | 'dismiss' | 'revoke'
export type PunishmentScope = 'user' | 'rule' | 'both'
export type BanDays = 1 | 3 | 5 | 7 | 30

export interface ReportTargetUser {
  id: string
  name?: string
  avatar?: string
}

export interface ReportTargetRule {
  id: string
  name?: string
  authorId?: string
  authorName?: string
}

export interface ReportPunishment {
  id: string
  action: Extract<ReportAction, 'ban_user' | 'ban_rule' | 'ban_both'>
  scope: PunishmentScope
  active: boolean
  banDays?: BanDays
  bannedUntil?: number
  ruleRemoved: boolean
  affectedReportIds: string[]
  createdAt: number
  revokedAt?: number
}

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
  targetUser?: ReportTargetUser
  targetRule?: ReportTargetRule
  reason: string
  details: string
  status: ReportStatus
  createdAt: number
  updatedAt: number
  context?: ReportContext
  punishment?: ReportPunishment
  mergedByPunishmentId?: string
  actionLog?: ReportActionLog[]
}

export interface ReportActionLog {
  id: string
  action: ReportAction
  operatorId: string
  note: string
  createdAt: number
  params?: ReportActionParams
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
  targetUser?: string
  targetRule?: string
  page?: number
}

export interface ReportActionParams {
  targetType?: ReportTargetType
  targetId?: string
  targetUserId?: string
  targetRuleId?: string
  ruleAuthorId?: string
  banDays?: BanDays
}

export interface ReportActionPayload {
  action: ReportAction
  note?: string
  params?: ReportActionParams
}

interface ApiResult<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

const REPORT_STORAGE_KEY = scopedStorageKey('mock-reports')
const DAY_IN_MS = 24 * 60 * 60 * 1000

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
    targetUser: payload.targetType === 'user' || payload.targetType === 'player_behavior'
      ? { id: payload.targetId, name: payload.context?.targetLabel }
      : undefined,
    targetRule: payload.targetType === 'rule' || payload.targetType === 'review'
      ? { id: payload.context?.ruleId || payload.targetId, name: payload.context?.targetLabel }
      : undefined,
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
  if (params.keyword?.trim()) searchParams.set('keyword', params.keyword.trim())
  if (params.targetUser?.trim()) searchParams.set('targetUser', params.targetUser.trim())
  if (params.targetRule?.trim()) searchParams.set('targetRule', params.targetRule.trim())
  if (params.page) searchParams.set('page', String(params.page))
  const value = searchParams.toString()
  return value ? `?${value}` : ''
}

function includesQuery(values: Array<string | undefined>, query?: string) {
  const normalized = query?.trim().toLowerCase()
  if (!normalized) return true
  return values.some(value => String(value || '').toLowerCase().includes(normalized))
}

function getTargetUserId(report: Report) {
  return report.targetUser?.id
    || (report.targetType === 'user' || report.targetType === 'player_behavior' ? report.targetId : undefined)
}

function getTargetRuleId(report: Report) {
  return report.targetRule?.id
    || report.context?.ruleId
    || (report.targetType === 'rule' || report.targetType === 'review' ? report.targetId : undefined)
}

function filterLocalReports(params: ReportQuery = {}) {
  return readLocalReports()
    .filter(report => params.status === 'all' || !params.status || report.status === params.status)
    .filter(report => params.targetType === 'all' || !params.targetType || report.targetType === params.targetType)
    .filter(report => includesQuery([
      report.targetId,
      report.reason,
      report.details,
      report.context?.targetLabel,
      report.reporterName,
      report.targetUser?.id,
      report.targetUser?.name,
      report.targetRule?.id,
      report.targetRule?.name,
    ], params.keyword))
    .filter(report => includesQuery([
      report.targetUser?.id,
      report.targetUser?.name,
      getTargetUserId(report),
    ], params.targetUser))
    .filter(report => includesQuery([
      report.targetRule?.id,
      report.targetRule?.name,
      getTargetRuleId(report),
    ], params.targetRule))
    .sort((left, right) => right.createdAt - left.createdAt)
}

function isSamePunishedTarget(
  source: Report,
  candidate: Report,
  scope: PunishmentScope,
  targetUserId?: string,
  targetRuleId?: string,
) {
  const punishedUserId = targetUserId || getTargetUserId(source)
  const punishedRuleId = targetRuleId || getTargetRuleId(source)
  const sameUser = Boolean(punishedUserId) && punishedUserId === getTargetUserId(candidate)
  const sameRule = Boolean(punishedRuleId) && punishedRuleId === getTargetRuleId(candidate)
  if (scope === 'user') return sameUser
  if (scope === 'rule') return sameRule
  return sameUser || sameRule
}

function actionScope(action: ReportAction): PunishmentScope | null {
  if (action === 'ban_user') return 'user'
  if (action === 'ban_rule') return 'rule'
  if (action === 'ban_both') return 'both'
  return null
}

function validateLocalAction(report: Report, payload: ReportActionPayload): string {
  if (payload.action === 'revoke') {
    return report.punishment?.active ? '' : '当前举报没有可撤销的有效惩罚'
  }
  if (report.status !== 'pending') return '该举报已处理，不能重复执行处罚'
  if ((payload.action === 'ban_user' || payload.action === 'ban_both') && !payload.params?.banDays) {
    return '请选择用户封禁时长'
  }
  if (
    payload.action === 'ban_user'
    && (report.targetType === 'rule' || report.targetType === 'review')
    && !report.targetRule?.authorId
    && !payload.params?.ruleAuthorId
  ) {
    return '缺少规则作者 ID，无法封禁作者'
  }
  if (payload.action === 'ban_both' && !report.targetRule?.authorId && !payload.params?.ruleAuthorId) {
    return '缺少规则作者 ID，无法封禁作者'
  }
  return ''
}

function saveLocalAction(reportId: string, payload: ReportActionPayload): ApiResult<Report> {
  const reports = readLocalReports()
  const report = reports.find(item => item.id === reportId)
  if (!report) return { success: false, message: '举报记录不存在' }

  const validationMessage = validateLocalAction(report, payload)
  if (validationMessage) return { success: false, message: validationMessage }

  const now = Date.now()
  if (payload.action === 'revoke' && report.punishment) {
    const punishmentId = report.punishment.id
    reports.forEach(item => {
      if (item.mergedByPunishmentId !== punishmentId) return
      item.status = 'pending'
      item.updatedAt = now
      delete item.mergedByPunishmentId
    })
    report.status = 'pending'
    report.punishment.active = false
    report.punishment.revokedAt = now
  } else if (payload.action === 'dismiss') {
    report.status = 'rejected'
  } else {
    const scope = actionScope(payload.action)
    if (!scope) return { success: false, message: '不支持的处罚动作' }

    const punishmentId = `punishment-${now}-${Math.random().toString(36).slice(2, 8)}`
    const affectedReportIds: string[] = []
    const targetUserId = payload.params?.targetUserId || payload.params?.ruleAuthorId
    const targetRuleId = payload.params?.targetRuleId
    reports.forEach(item => {
      if (item.id === report.id || item.status !== 'pending') return
      if (!isSamePunishedTarget(report, item, scope, targetUserId, targetRuleId)) return
      item.status = 'resolved'
      item.updatedAt = now
      item.mergedByPunishmentId = punishmentId
      affectedReportIds.push(item.id)
    })

    const banDays = payload.params?.banDays
    report.status = 'resolved'
    report.punishment = {
      id: punishmentId,
      action: payload.action,
      scope,
      active: true,
      banDays,
      bannedUntil: banDays ? now + banDays * DAY_IN_MS : undefined,
      ruleRemoved: scope === 'rule' || scope === 'both',
      affectedReportIds,
      createdAt: now,
    }
  }

  report.updatedAt = now
  report.actionLog = [
    ...(report.actionLog || []),
    {
      id: `action-${now}-${Math.random().toString(36).slice(2, 8)}`,
      action: payload.action,
      operatorId: 'admin',
      note: payload.note || '',
      createdAt: now,
      params: payload.params,
    },
  ]
  writeLocalReports(reports)
  return { success: true, data: report }
}

export const reportApi = {
  async submit(payload: SubmitReportPayload): Promise<ApiResult<Report>> {
    const result = await apiPost<ApiResult<Report>>('/api/reports', payload, { useMock: false })
    if (result.success) return result

    const report = createLocalReport(payload)
    writeLocalReports([report, ...readLocalReports()])
    return { success: true, data: report, message: '已保存到本地模拟举报列表' }
  },

  async list(params: ReportQuery = {}): Promise<ApiResult<Report[]>> {
    const result = await apiGet<ApiResult<Report[]>>(`/api/reports${queryString(params)}`, { useMock: false })
    if (result.success && Array.isArray(result.data)) return result
    return { success: true, data: filterLocalReports(params) }
  },

  async get(id: string): Promise<ApiResult<Report>> {
    const result = await apiGet<ApiResult<Report>>(`/api/reports/${encodeURIComponent(id)}`, { useMock: false })
    if (result.success && result.data) return result

    const report = readLocalReports().find(item => item.id === id)
    return report ? { success: true, data: report } : { success: false, message: '举报记录不存在' }
  },

  async counts(): Promise<ApiResult<{ pending: number }>> {
    const result = await apiGet<ApiResult<{ pending: number }>>('/api/reports/counts', { useMock: false })
    if (result.success && result.data) return result
    return {
      success: true,
      data: { pending: readLocalReports().filter(report => report.status === 'pending').length },
    }
  },

  async action(reportId: string, payload: ReportActionPayload): Promise<ApiResult<Report>> {
    const result = await apiPost<ApiResult<Report>>(
      `/api/reports/${encodeURIComponent(reportId)}/action`,
      payload,
      { useMock: false },
    )
    if (result.success) return result
    return saveLocalAction(reportId, payload)
  },
}
