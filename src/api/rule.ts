import type { ExportedRuleDesign } from '../types/ruleBuilder'
import { apiDelete, apiGet, apiPost, apiPut } from './request'

const RULE_DRAFT_STORAGE_KEY = 'wildcard-rule-design-draft'

interface SaveRuleDesignParams {
  name: string
  playerCount: number
  description: string
  design: ExportedRuleDesign
}

export interface RuleDraftSummary {
  id: string
  name: string
  playerCount: number
  description: string
  status: 'draft' | 'published'
  updatedAt: number
  publishedRuleId?: string
}

export interface RuleDraftDetail extends RuleDraftSummary {
  ownerId?: string
  design: ExportedRuleDesign
  createdAt: number
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

  async saveRuleDesign(params: SaveRuleDesignParams): Promise<ApiResult<{ draftId: string; ruleId: string }>> {
    const draftResult = await this.createDraft(params)

    if (!draftResult.success || !draftResult.data?.id) {
      return { success: false, message: draftResult.message || '规则草稿保存失败' }
    }

    const publishResult = await this.publishDraft(draftResult.data.id)

    if (!publishResult.success || !publishResult.data?.ruleId) {
      return { success: false, message: publishResult.message || '规则发布失败' }
    }

    return {
      success: true,
      data: {
        draftId: draftResult.data.id,
        ruleId: publishResult.data.ruleId,
      },
    }
  },
}
