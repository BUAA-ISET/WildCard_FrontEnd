import { apiGet, apiPost } from './request'
import type { ExportedRuleDesign } from '../types/ruleBuilder'

/**
 * 审核员视角下的待审草稿。BE `GET /api/admin/rules/pending` 直接返回此结构的数组。
 * 备注：introduction / coverUrl / screenshotUrls 是 Phase 1B 新增字段，老草稿可能为空。
 */
export interface PendingReviewDraft {
  draftId: string
  name: string
  ownerId: string
  ownerName: string
  playerCount: number
  description: string
  updatedAt: number
  design: ExportedRuleDesign | unknown
  introduction?: string
  coverUrl?: string
  screenshotUrls?: string[]
}

export interface ApproveResponse {
  ruleId: string
  version: number
  status: string
}

export interface RejectResponse {
  id: string
  status: string
  updatedAt: number
}

interface ApiResult<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

export const adminApi = {
  /**
   * 拉取所有待审核草稿。仅 admin 可调，BE 对非 admin 返 403。
   */
  async listPending(): Promise<ApiResult<PendingReviewDraft[]>> {
    return apiGet<ApiResult<PendingReviewDraft[]>>('/api/admin/rules/pending', {
      useMock: false,
    })
  },

  /**
   * 批准草稿发布。BE 返回新建的 ruleId / version / 状态。
   */
  async approve(draftId: string): Promise<ApiResult<ApproveResponse>> {
    return apiPost<ApiResult<ApproveResponse>>(
      `/api/admin/rules/${encodeURIComponent(draftId)}/approve`,
      {},
      { useMock: false },
    )
  },

  /**
   * 驳回草稿，必须带上原因（≤512 字）。
   */
  async reject(draftId: string, reason: string): Promise<ApiResult<RejectResponse>> {
    return apiPost<ApiResult<RejectResponse>>(
      `/api/admin/rules/${encodeURIComponent(draftId)}/reject`,
      { reason },
      { useMock: false },
    )
  },
}
