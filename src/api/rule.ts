import type { ExportedRuleDesign } from '../types/ruleBuilder'

export const ruleApi = {
  async saveRuleDesign(design: ExportedRuleDesign): Promise<{ success: boolean }> {
    // TODO: 后端规则保存接口完成后，在这里替换为 axios.post('/rules', design)。
    localStorage.setItem('wildcard-rule-design-draft', JSON.stringify(design))
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true }
  },
}
