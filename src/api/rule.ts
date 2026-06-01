import type { ExportedRuleDesign } from '../types/ruleBuilder'
import { apiDelete, apiGet, apiPost, apiPut } from './request'
import { getApiUrl } from './config'
import { AUTH_TOKEN_STORAGE_KEY } from '../utils/storageNamespace'

const RULE_DRAFT_STORAGE_KEY = 'wildcard-rule-design-draft'

interface SaveRuleDesignParams {
  name: string
  playerCount: number
  description: string
  design: ExportedRuleDesign
  introduction?: string
  coverUrl?: string
  screenshotUrls?: string[]
}

export type RuleDraftStatus = 'draft' | 'pendingReview' | 'published' | 'rejected'

export interface RuleDraftSummary {
  id: string
  name: string
  playerCount: number
  description: string
  status: RuleDraftStatus
  updatedAt: number
  publishedRuleId?: string
  rejectReason?: string
  introduction?: string
  coverUrl?: string
  screenshotUrls?: string[]
}

export interface RuleDraftDetail extends RuleDraftSummary {
  ownerId?: string
  design: ExportedRuleDesign
  createdAt: number
}

export interface SubmitReviewResponse {
  id: string
  status: string
  updatedAt: number
}

interface ApiResult<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

export const ruleApi = {
  async listDrafts(): Promise<ApiResult<RuleDraftSummary[]>> {
    return apiGet<ApiResult<RuleDraftSummary[]>>('/api/rules/drafts', { useMock: false })
  },

  async getDraft(draftId: string): Promise<ApiResult<RuleDraftDetail>> {
    return apiGet<ApiResult<RuleDraftDetail>>(`/api/rules/drafts/${encodeURIComponent(draftId)}`, {
      useMock: false,
    })
  },

  async createDraft(params: SaveRuleDesignParams): Promise<ApiResult<{ id: string; updatedAt: number }>> {
    const design = params.design
    // 本地仍保留一份导出的 JSON，便于后端不可用时排查用户刚刚构建的规则内容。
    localStorage.setItem(RULE_DRAFT_STORAGE_KEY, JSON.stringify(design))

    return apiPost<ApiResult<{ id: string; updatedAt: number }>>('/api/rules/drafts', params, { useMock: false })
  },

  async updateDraft(draftId: string, params: SaveRuleDesignParams): Promise<ApiResult<{ id: string; updatedAt: number }>> {
    localStorage.setItem(RULE_DRAFT_STORAGE_KEY, JSON.stringify(params.design))

    return apiPut<ApiResult<{ id: string; updatedAt: number }>>(
      `/api/rules/drafts/${encodeURIComponent(draftId)}`,
      params,
      { useMock: false },
    )
  },

  /**
   * 作者提交草稿进入审核流。BE 接管发布动作，由审核员决定是否上架。
   */
  async submitReview(draftId: string): Promise<ApiResult<SubmitReviewResponse>> {
    return apiPost<ApiResult<SubmitReviewResponse>>(
      `/api/rules/drafts/${encodeURIComponent(draftId)}/submit-review`,
      {},
      { useMock: false },
    )
  },

  /**
   * @deprecated 旧的"直接发布"路径，BE 内部已转发到 submit-review。
   * 新代码请使用 {@link ruleApi.submitReview}。
   */
  async publishDraft(draftId: string): Promise<ApiResult<{ ruleId: string; version: number }>> {
    return apiPost<ApiResult<{ ruleId: string; version: number }>>(
      `/api/rules/drafts/${encodeURIComponent(draftId)}/publish`,
      {},
      { useMock: false },
    )
  },

  async deleteDraft(draftId: string): Promise<ApiResult<RuleDraftSummary>> {
    return apiDelete<ApiResult<RuleDraftSummary>>(
      `/api/rules/drafts/${encodeURIComponent(draftId)}`,
      { useMock: false },
    )
  },

  /**
   * 把规则相关图片（封面 / 截图）multipart 上传到 BE，拿到短 URL（/static/rule-images/<uuid>.<ext>）
   * FE 拿到 imageUrl 后自行把它塞到 draft 的 coverUrl 或 screenshotUrls 字段，再走 updateDraft 持久化。
   */
  async uploadRuleImage(draftId: string, file: File): Promise<ApiResult<{ imageUrl: string }>> {
    const form = new FormData()
    form.append('file', file)
    const url = getApiUrl(`/api/rules/drafts/${encodeURIComponent(draftId)}/images`)
    const token =
      (typeof window !== 'undefined' &&
        (window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
          window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY))) ||
      ''
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'omit',
        headers,
        body: form,
      })
      const text = await response.text()
      const result = text ? JSON.parse(text) : {}
      if (!response.ok) {
        return {
          success: false,
          message: result?.message || `上传失败 (HTTP ${response.status})`,
        }
      }
      return result
    } catch (err) {
      console.warn('[ruleApi.uploadRuleImage] request failed', err)
      return { success: false, message: '图片上传失败，请稍后重试' }
    }
  },

  /**
   * 一站式：保存草稿并提交审核。原先此方法直接发布（绕过审核），现已改为提交审核。
   * 成功后的 `ruleId` 字段在审核未通过前可能为空字符串，调用方应据 status 判断。
   */
  async saveRuleDesign(params: SaveRuleDesignParams): Promise<ApiResult<{ draftId: string; ruleId: string; status: string }>> {
    const draftResult = await this.createDraft(params)

    if (!draftResult.success || !draftResult.data?.id) {
      return { success: false, message: draftResult.message || '规则草稿保存失败' }
    }

    const submitResult = await this.submitReview(draftResult.data.id)

    if (!submitResult.success || !submitResult.data) {
      return { success: false, message: submitResult.message || '规则提交审核失败' }
    }

    return {
      success: true,
      data: {
        draftId: draftResult.data.id,
        ruleId: '',
        status: submitResult.data.status,
      },
    }
  },
}
