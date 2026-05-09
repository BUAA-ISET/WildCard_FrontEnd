import type { ExportedRuleDesign } from '../types/ruleBuilder'

const RULE_DRAFT_STORAGE_KEY = 'wildcard-rule-design-draft'

export const ruleApi = {
  async saveRuleDesign(design: ExportedRuleDesign): Promise<{ success: boolean }> {
    localStorage.setItem(RULE_DRAFT_STORAGE_KEY, JSON.stringify(design))
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true }
  },
}
