import type { ExportedRuleDesign } from '../types/ruleBuilder'
import { apiPost } from './request'

const RULE_DRAFT_STORAGE_KEY = 'wildcard-rule-design-draft'

interface SaveRuleDesignParams {
  name: string
  playerCount: number
  description: string
  design: ExportedRuleDesign
}

interface SaveRuleDesignResponse {
  success: boolean
  data?: {
    draftId: string
    ruleId: string
  }
  message?: string
}

export const ruleApi = {
  async saveRuleDesign(params: SaveRuleDesignParams): Promise<SaveRuleDesignResponse> {
    const design = params.design
    // 本地仍保留一份导出的 JSON，便于后端不可用时排查用户刚刚构建的规则内容。
    localStorage.setItem(RULE_DRAFT_STORAGE_KEY, JSON.stringify(design))

    const draftResult = await apiPost<{
      success: boolean
      data?: { id: string }
      message?: string
    }>('/api/rules/drafts', params, { useMock: false })

    if (!draftResult.success || !draftResult.data?.id) {
      return {
        success: false,
        message: draftResult.message || '规则草稿保存失败',
      }
    }

    const publishResult = await apiPost<{
      success: boolean
      data?: { ruleId: string }
      message?: string
    }>(`/api/rules/drafts/${draftResult.data.id}/publish`, {}, { useMock: false })

    if (!publishResult.success || !publishResult.data?.ruleId) {
      return {
        success: false,
        message: publishResult.message || '规则发布失败',
      }
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
