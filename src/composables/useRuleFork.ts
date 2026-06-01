import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { marketApi, type PublishedRuleSummary } from '../api/market'
import { useUserStore } from '../stores/userStore'

export function useRuleFork() {
  const router = useRouter()
  const userStore = useUserStore()

  async function forkRule(rule: Pick<PublishedRuleSummary, 'id' | 'name'>) {
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再 Fork 规则')
      return
    }

    let inputName: string
    try {
      const result = await ElMessageBox.prompt('为你的副本起个名字', 'Fork 规则', {
        confirmButtonText: '创建副本',
        cancelButtonText: '取消',
        inputValue: `${rule.name} (副本)`,
        inputValidator: (val: string) => {
          const trimmed = (val || '').trim()
          if (!trimmed) return '名称不能为空'
          if (trimmed.length > 255) return '名称过长（≤255）'
          return true
        },
      })
      inputName = (result.value || '').trim()
    } catch (err) {
      if (err !== 'cancel' && err !== 'close') {
        console.warn('[useRuleFork] prompt unexpected error', err)
      }
      return
    }

    let apiResult
    try {
      apiResult = await marketApi.forkRule(rule.id, inputName)
    } catch (err) {
      console.warn('[useRuleFork] forkRule request failed', err)
      ElMessage.error('Fork 请求失败，请稍后重试')
      return
    }
    if (!apiResult.success || !apiResult.data) {
      ElMessage.error(apiResult.message || 'Fork 失败')
      return
    }

    ElMessage.success('副本已创建，正在进入创作中心…')
    void router.push(`/creation-center/${encodeURIComponent(apiResult.data.id)}`)
  }

  return { forkRule }
}
