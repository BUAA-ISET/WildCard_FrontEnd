<template>
  <div class="creation-center-page">
    <header class="creation-header">
      <div>
        <h1>创作中心</h1>
        <p>管理你创建的规则草稿和已发布规则。</p>
      </div>
      <div class="header-actions">
        <el-button
          type="danger"
          :disabled="selectedCount === 0"
          :loading="deleting"
          @click="deleteSelectedRules"
        >
          删除已选
        </el-button>
        <el-button type="primary" @click="createRule">创建新规则</el-button>
      </div>
    </header>

    <main class="rule-list">
      <div v-if="loading" class="empty-state">正在加载规则...</div>
      <div v-else-if="rules.length === 0" class="empty-state">
        <h2>暂无规则</h2>
        <p>点击“创建新规则”开始构建你的第一套规则。</p>
      </div>
      <div v-else class="bulk-toolbar">
        <label class="select-all">
          <input
            type="checkbox"
            :checked="allSelected"
            :indeterminate="someSelected"
            @change="toggleAllSelection"
          >
          <span>全选</span>
        </label>
        <span>已选择 {{ selectedCount }} 个规则</span>
      </div>
      <article
        v-for="rule in rules"
        :key="rule.id"
        class="rule-row"
        role="button"
        tabindex="0"
        @click="openRule(rule.id)"
        @keydown.enter.prevent="openRule(rule.id)"
      >
        <label class="selection-cell" @click.stop>
          <input
            type="checkbox"
            :checked="selectedRuleIds.has(rule.id)"
            @change="toggleRuleSelection(rule.id)"
          >
        </label>
        <div>
          <strong>{{ rule.name || '未命名规则' }}</strong>
          <p>{{ rule.description || '暂无规则说明' }}</p>
          <p
            v-if="rule.status === 'rejected' && rule.rejectReason"
            class="reject-reason"
          >
            驳回原因：{{ rule.rejectReason }}
          </p>
        </div>
        <div class="rule-meta">
          <span>{{ rule.playerCount }} 人</span>
          <span
            :class="['status-pill', rule.status]"
            :title="rule.status === 'rejected' && rule.rejectReason ? `驳回原因：${rule.rejectReason}` : undefined"
          >{{ statusLabel(rule.status) }}</span>
          <span>{{ formatTime(rule.updatedAt) }}</span>
          <button
            type="button"
            class="delete-action"
            :disabled="deleting"
            @click.stop="deleteRule(rule.id)"
          >
            删除
          </button>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ruleApi, type RuleDraftStatus, type RuleDraftSummary } from '../api/rule'

const router = useRouter()
const loading = ref(false)
const deleting = ref(false)
const rules = ref<RuleDraftSummary[]>([])
const selectedRuleIds = ref<Set<string>>(new Set())

const selectedCount = computed(() => selectedRuleIds.value.size)
const allSelected = computed(() => rules.value.length > 0 && selectedRuleIds.value.size === rules.value.length)
const someSelected = computed(() => selectedRuleIds.value.size > 0 && selectedRuleIds.value.size < rules.value.length)

const STATUS_LABELS: Record<RuleDraftStatus, string> = {
  draft: '草稿',
  pendingReview: '审核中',
  published: '已发布',
  rejected: '已驳回',
}

function statusLabel(status: RuleDraftStatus | string | undefined) {
  if (!status) return '草稿'
  return STATUS_LABELS[status as RuleDraftStatus] ?? status
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadRules() {
  loading.value = true
  const result = await ruleApi.listDrafts()
  loading.value = false

  if (!result.success) {
    ElMessage.error(result.message || '规则列表加载失败')
    return
  }

  rules.value = result.data || []
  selectedRuleIds.value = new Set([...selectedRuleIds.value].filter(id => rules.value.some(rule => rule.id === id)))
}

function createRule() {
  void router.push('/creation-center/new')
}

async function deleteRule(draftId: string) {
  const target = rules.value.find(rule => rule.id === draftId)
  try {
    await ElMessageBox.confirm(
      `确定要删除规则“${target?.name || '未命名规则'}”吗？删除后无法恢复。`,
      '删除规则',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch {
    return
  }

  deleting.value = true
  const result = await ruleApi.deleteDraft(draftId)
  deleting.value = false

  if (!result.success) {
    ElMessage.error(result.message || '规则删除失败')
    return
  }

  rules.value = rules.value.filter(rule => rule.id !== draftId)
  selectedRuleIds.value = new Set([...selectedRuleIds.value].filter(id => id !== draftId))
  ElMessage.success('规则已删除')
}

function toggleRuleSelection(draftId: string) {
  const next = new Set(selectedRuleIds.value)
  if (next.has(draftId)) {
    next.delete(draftId)
  } else {
    next.add(draftId)
  }
  selectedRuleIds.value = next
}

function toggleAllSelection() {
  selectedRuleIds.value = allSelected.value
    ? new Set()
    : new Set(rules.value.map(rule => rule.id))
}

async function deleteSelectedRules() {
  const draftIds = [...selectedRuleIds.value]
  if (draftIds.length === 0 || deleting.value) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除已选择的 ${draftIds.length} 个规则吗？删除后无法恢复。`,
      '批量删除规则',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch {
    return
  }

  deleting.value = true
  const results = await Promise.all(
    draftIds.map(async draftId => {
      try {
        return { draftId, result: await ruleApi.deleteDraft(draftId) }
      } catch (error) {
        return {
          draftId,
          result: {
            success: false,
            message: error instanceof Error ? error.message : '规则删除失败',
          },
        }
      }
    }),
  )
  deleting.value = false

  const deletedIds = results
    .filter(item => item.result.success)
    .map(item => item.draftId)
  const deletedIdSet = new Set(deletedIds)
  rules.value = rules.value.filter(rule => !deletedIdSet.has(rule.id))
  selectedRuleIds.value = new Set([...selectedRuleIds.value].filter(id => !deletedIdSet.has(id)))

  const failedCount = results.length - deletedIds.length
  if (failedCount > 0) {
    ElMessage.error(`已删除 ${deletedIds.length} 个规则，${failedCount} 个规则删除失败`)
    return
  }

  ElMessage.success(`已删除 ${deletedIds.length} 个规则`)
}

function openRule(draftId: string) {
  void router.push(`/creation-center/${encodeURIComponent(draftId)}`)
}

onMounted(() => {
  void loadRules()
})
</script>

<style scoped>
.creation-center-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f6fa;
  color: #252633;
  text-align: left;
}

.creation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding: 22px 24px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.creation-header h1 {
  margin: 0;
  font-size: 26px;
}

.creation-header p {
  margin: 6px 0 0;
  color: #4a5063;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.rule-list {
  display: grid;
  gap: 12px;
}

.bulk-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
  color: #4a5063;
  font-size: 14px;
}

.select-all,
.selection-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.select-all input,
.selection-cell input {
  width: 16px;
  height: 16px;
  accent-color: #4f63ff;
  cursor: pointer;
}

.rule-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  width: 100%;
  padding: 18px 20px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.rule-row:hover {
  border-color: #7b8cff;
  box-shadow: 0 8px 22px rgba(42, 55, 120, 0.08);
}

.rule-row strong {
  font-size: 17px;
}

.rule-row p {
  margin: 6px 0 0;
  color: #4a5063;
}

.rule-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4a5063;
  font-size: 13px;
}

.status-pill {
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef1f7;
  color: #3a4050;
}

.status-pill.draft {
  background: #eef1f7;
  color: #3a4050;
}

.status-pill.pendingReview {
  background: #e6f0ff;
  color: #1a5fbf;
}

.status-pill.published {
  background: #e8f7ef;
  color: #16713a;
}

.status-pill.rejected {
  background: #fdecec;
  color: #b42323;
  cursor: help;
}

.reject-reason {
  margin: 6px 0 0;
  color: #b42323;
  font-size: 13px;
}

.delete-action {
  border: 0;
  padding: 4px 8px;
  border-radius: 6px;
  background: transparent;
  color: #b42323;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.delete-action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.delete-action:hover,
.delete-action:focus {
  background: #fff0f0;
  outline: none;
}

.empty-state {
  padding: 36px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}

.empty-state h2 {
  margin: 0 0 8px;
}

.empty-state p {
  margin: 0;
  color: #4a5063;
}

@media (max-width: 760px) {
  .creation-header {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .rule-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .rule-meta {
    grid-column: 2;
    flex-wrap: wrap;
  }
}
</style>
