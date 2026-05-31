<template>
  <div class="admin-review-page">
    <header class="review-header">
      <div>
        <h1>规则审核</h1>
        <p>查看作者提交的规则草稿，决定批准发布或驳回修改。</p>
      </div>
      <el-button :loading="loading" @click="loadPending">刷新</el-button>
    </header>

    <div v-if="loading && drafts.length === 0" class="empty-state">正在加载待审规则...</div>
    <el-empty v-else-if="!loading && drafts.length === 0" description="暂无待审规则" />

    <div v-else class="review-layout">
      <aside class="pending-list">
        <article
          v-for="draft in drafts"
          :key="draft.draftId"
          :class="['pending-row', { active: selectedId === draft.draftId }]"
          role="button"
          tabindex="0"
          @click="selectDraft(draft.draftId)"
          @keydown.enter.prevent="selectDraft(draft.draftId)"
        >
          <strong>{{ draft.name || '未命名规则' }}</strong>
          <p class="row-author">作者：{{ draft.ownerName || draft.ownerId }}</p>
          <p class="row-meta">
            <span>{{ draft.playerCount }} 人</span>
            <span>{{ formatTime(draft.updatedAt) }}</span>
          </p>
        </article>
      </aside>

      <section class="detail-panel">
        <el-empty v-if="!selectedDraft" description="请从左侧选择一条待审规则" />
        <template v-else>
          <header class="detail-header">
            <div>
              <h2>{{ selectedDraft.name || '未命名规则' }}</h2>
              <p class="detail-author">
                <span>作者：{{ selectedDraft.ownerName || selectedDraft.ownerId }}</span>
                <span>玩家数：{{ selectedDraft.playerCount }}</span>
                <span>提交时间：{{ formatTime(selectedDraft.updatedAt) }}</span>
              </p>
            </div>
            <div class="detail-header-actions">
              <el-button type="primary" plain @click="openVisualPreview">可视化预览</el-button>
            </div>
          </header>

          <section class="detail-section">
            <h3>规则简介</h3>
            <p class="detail-description">{{ selectedDraft.description || '作者未填写说明' }}</p>
            <pre v-if="selectedDraft.introduction" class="detail-introduction">{{ selectedDraft.introduction }}</pre>
            <p v-else class="detail-introduction empty">作者未填写玩法介绍。</p>
          </section>

          <section v-if="selectedDraft.coverUrl" class="detail-section">
            <h3>规则封面</h3>
            <img class="detail-cover" :src="resolveImageUrl(selectedDraft.coverUrl)" alt="规则封面">
          </section>

          <section v-if="screenshots.length > 0" class="detail-section">
            <h3>规则截图</h3>
            <div class="screenshot-grid">
              <img
                v-for="(shot, index) in screenshots"
                :key="shot + index"
                :src="resolveImageUrl(shot)"
                :alt="`截图 ${index + 1}`"
                class="detail-screenshot"
              >
            </div>
          </section>

          <section class="detail-section design-section">
            <button type="button" class="design-toggle" @click="designVisible = !designVisible">
              {{ designVisible ? '收起规则 JSON' : '查看规则 JSON' }}
            </button>
            <pre v-if="designVisible" class="design-json"><code>{{ designJsonText }}</code></pre>
          </section>

          <footer class="detail-actions">
            <el-button
              type="success"
              :loading="approving"
              :disabled="rejecting"
              @click="handleApprove"
            >
              批准发布
            </el-button>
            <el-button
              type="danger"
              :loading="rejecting"
              :disabled="approving"
              @click="handleReject"
            >
              驳回
            </el-button>
          </footer>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi, type PendingReviewDraft } from '../api/admin'
import { getApiUrl } from '../api/config'

const router = useRouter()
const loading = ref(false)
const approving = ref(false)
const rejecting = ref(false)
const drafts = ref<PendingReviewDraft[]>([])
const selectedId = ref<string>('')
const designVisible = ref(false)

const selectedDraft = computed(() =>
  drafts.value.find(draft => draft.draftId === selectedId.value) || null,
)

const screenshots = computed(() =>
  (selectedDraft.value?.screenshotUrls || []).filter(Boolean),
)

const designJsonText = computed(() => {
  if (!selectedDraft.value) return ''
  try {
    return JSON.stringify(selectedDraft.value.design, null, 2)
  } catch {
    return String(selectedDraft.value.design)
  }
})

function formatTime(timestamp: number) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * BE 返回的图片 URL 是相对路径（/static/rule-images/<uuid>.<ext>），
 * 这里复用 getApiUrl 让 dev/prod 都能拼对域名；http/data URL 直接透传。
 */
function resolveImageUrl(url: string) {
  if (!url) return ''
  if (/^(https?:|data:)/i.test(url)) return url
  return getApiUrl(url)
}

function selectDraft(draftId: string) {
  selectedId.value = draftId
  designVisible.value = false
}

/**
 * 当前 tab 跳转到 RuleBuilder 的只读预览路由。
 * 之前尝试过 window.open 新窗（sessionStorage 不跨 tab）和 dialog + 同源 iframe
 * （内嵌时高度链塌成 0），都不顺；改回最朴素的 router.push，
 * 看完点页面里的「返回审核面板」按钮回来。
 */
function openVisualPreview() {
  if (!selectedDraft.value) return
  void router.push(`/admin/rules-review/preview/${selectedDraft.value.draftId}`)
}

async function loadPending() {
  loading.value = true
  const result = await adminApi.listPending()
  loading.value = false

  if (!result.success) {
    ElMessage.error(result.message || '待审规则加载失败')
    return
  }

  drafts.value = result.data || []
  // 当前选中项若已被其他审核员处理，则清空右侧。
  if (selectedId.value && !drafts.value.some(draft => draft.draftId === selectedId.value)) {
    selectedId.value = ''
  }
}

async function handleApprove() {
  if (!selectedDraft.value) return
  const draft = selectedDraft.value

  try {
    await ElMessageBox.confirm(
      `确认批准规则“${draft.name || '未命名规则'}”发布吗？发布后将立即出现在规则市场。`,
      '批准规则',
      {
        confirmButtonText: '批准',
        cancelButtonText: '取消',
        type: 'success',
      },
    )
  } catch {
    return
  }

  approving.value = true
  const result = await adminApi.approve(draft.draftId)
  approving.value = false

  if (!result.success) {
    ElMessage.error(result.message || '规则批准失败')
    return
  }

  ElMessage.success('规则已批准发布')
  selectedId.value = ''
  await loadPending()
}

async function handleReject() {
  if (!selectedDraft.value) return
  const draft = selectedDraft.value

  let reasonInput: string
  try {
    const result = await ElMessageBox.prompt(
      `请填写驳回原因（必填，≤512 字）`,
      `驳回规则：${draft.name || '未命名规则'}`,
      {
        confirmButtonText: '驳回',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value: string) => {
          const trimmed = (value || '').trim()
          if (!trimmed) return '请填写驳回原因'
          if (trimmed.length > 512) return '驳回原因不能超过 512 字'
          return true
        },
      },
    )
    reasonInput = (result.value || '').trim()
  } catch {
    return
  }

  rejecting.value = true
  const result = await adminApi.reject(draft.draftId, reasonInput)
  rejecting.value = false

  if (!result.success) {
    ElMessage.error(result.message || '规则驳回失败')
    return
  }

  ElMessage.success('规则已驳回')
  selectedId.value = ''
  await loadPending()
}

onMounted(() => {
  void loadPending()
})
</script>

<style scoped>
.admin-review-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f6fa;
  color: #252633;
  text-align: left;
}

.review-header {
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

.review-header h1 {
  margin: 0;
  font-size: 26px;
}

.review-header p {
  margin: 6px 0 0;
  color: #4a5063;
}

.empty-state {
  padding: 36px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
  text-align: center;
  color: #4a5063;
}

.review-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  padding-right: 4px;
}

.pending-row {
  padding: 14px 16px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.pending-row:hover {
  border-color: #7b8cff;
  box-shadow: 0 6px 18px rgba(42, 55, 120, 0.08);
}

.pending-row.active {
  border-color: #4f63ff;
  background: #eef1ff;
}

.pending-row strong {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
  word-break: break-word;
}

.row-author {
  margin: 0 0 6px;
  color: #4a5063;
  font-size: 13px;
}

.row-meta {
  margin: 0;
  display: flex;
  gap: 10px;
  color: #6b7280;
  font-size: 12px;
}

.detail-panel {
  padding: 22px 24px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
  min-height: 320px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.detail-header h2 {
  margin: 0;
  font-size: 22px;
}

.detail-header-actions {
  flex-shrink: 0;
}

.detail-author {
  margin: 8px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #4a5063;
  font-size: 13px;
}

.detail-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eef0f6;
}

.detail-section h3 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #2d3142;
}

.detail-description {
  margin: 0 0 10px;
  color: #3a4050;
  line-height: 1.55;
}

.detail-introduction {
  margin: 0;
  padding: 12px 14px;
  border-radius: 6px;
  background: #f5f6fa;
  white-space: pre-wrap;
  word-break: break-word;
  font: inherit;
  color: #2d3142;
  line-height: 1.55;
}

.detail-introduction.empty {
  color: #9097a8;
  background: transparent;
  padding: 0;
}

.detail-cover {
  max-width: 100%;
  max-height: 280px;
  border-radius: 6px;
  border: 1px solid #dfe3ec;
}

.screenshot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-screenshot {
  width: 160px;
  height: 110px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #dfe3ec;
}

.design-section {
  text-align: left;
}

.design-toggle {
  border: 1px solid #4f63ff;
  background: #eef1ff;
  color: #2d3fb5;
  border-radius: 6px;
  padding: 6px 12px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.design-toggle:hover,
.design-toggle:focus {
  background: #dfe5ff;
  outline: none;
}

.design-json {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 6px;
  background: #1f2433;
  color: #e8eaf6;
  max-height: 380px;
  overflow: auto;
  font-family: 'Fira Code', Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre;
}

.detail-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 920px) {
  .review-layout {
    grid-template-columns: 1fr;
  }

  .pending-list {
    max-height: none;
  }
}
</style>
