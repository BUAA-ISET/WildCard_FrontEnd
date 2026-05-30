<template>
  <div class="publish-page">
    <header class="publish-header">
      <div>
        <h1>发布规则</h1>
        <p v-if="ruleName" class="rule-name">{{ ruleName }} · {{ playerCount }} 人</p>
      </div>
      <div class="header-actions">
        <el-button @click="backToCenter">返回创作中心</el-button>
        <el-button @click="saveDraft" :loading="saving">保存草稿</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="submitDisabled"
          @click="submitForReview"
        >
          {{ submitButtonLabel }}
        </el-button>
      </div>
    </header>

    <div
      v-if="draftStatus === 'rejected' && rejectReason"
      class="reject-banner"
    >
      上次审核被驳回：{{ rejectReason }}。修改后可重新提交审核。
    </div>

    <el-skeleton v-if="loading" :rows="6" animated />

    <div v-else class="publish-grid">
      <section class="card cover-card">
        <h2>规则封面</h2>
        <p class="muted">单张图片，建议 16:9。支持 png/jpeg/webp，最大 4MB。</p>
        <div class="cover-area">
          <div class="cover-preview">
            <img v-if="coverUrl" :src="resolveImageUrl(coverUrl)" alt="封面预览">
            <span v-else>暂无封面</span>
          </div>
          <div class="cover-actions">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/png,image/jpeg,image/webp"
              :on-change="handleCoverChange"
            >
              <el-button :loading="uploadingCover">{{ coverUrl ? '更换封面' : '上传封面' }}</el-button>
            </el-upload>
            <el-button
              v-if="coverUrl"
              class="text-btn"
              :disabled="uploadingCover"
              @click="clearCover"
            >
              移除封面
            </el-button>
          </div>
        </div>
      </section>

      <section class="card intro-card">
        <h2>规则介绍</h2>
        <p class="muted">支持换行；可以写玩法概述、更新日志等。</p>
        <el-input
          v-model="introduction"
          type="textarea"
          :rows="12"
          maxlength="4000"
          show-word-limit
          placeholder="写下规则的玩法概述、亮点、更新日志……"
        />
      </section>

      <section class="card shots-card">
        <div class="shots-head">
          <h2>规则截图</h2>
          <span class="muted">最多 {{ MAX_SCREENSHOTS }} 张，支持 png/jpeg/webp，单张最大 4MB。</span>
        </div>
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          :multiple="true"
          accept="image/png,image/jpeg,image/webp"
          :on-change="handleScreenshotChange"
        >
          <el-button :disabled="screenshotsFull || uploadingScreenshot">
            {{ uploadingScreenshot ? '上传中…' : (screenshotsFull ? '已达上限' : '上传截图') }}
          </el-button>
        </el-upload>
        <div v-if="screenshotUrls.length === 0" class="shots-empty muted">
          还没有截图。
        </div>
        <ul v-else class="shots-list">
          <li
            v-for="(url, index) in screenshotUrls"
            :key="url + index"
            class="shot-item"
          >
            <img :src="resolveImageUrl(url)" :alt="`截图 ${index + 1}`">
            <button
              type="button"
              class="shot-remove"
              :disabled="uploadingScreenshot"
              @click="removeScreenshot(index)"
            >
              移除
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { ruleApi, type RuleDraftStatus } from '../api/rule'
import { getApiUrl } from '../api/config'

const MAX_SCREENSHOTS = 10
const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)
const uploadingCover = ref(false)
const uploadingScreenshot = ref(false)

const draftId = ref<string>('')
const ruleName = ref<string>('')
const playerCount = ref<number>(0)
const description = ref<string>('')
const draftStatus = ref<RuleDraftStatus>('draft')
const rejectReason = ref<string>('')

const introduction = ref<string>('')
const coverUrl = ref<string>('')
const screenshotUrls = ref<string[]>([])

// design 字段必须回传给 BE，否则 PUT draft 会把现有 design 覆盖空。
// 进入页面时拉到的 design 直接缓存在内存中，本页不展示也不修改。
let cachedDesign: unknown = null

const screenshotsFull = computed(() => screenshotUrls.value.length >= MAX_SCREENSHOTS)

const submitButtonLabel = computed(() => {
  switch (draftStatus.value) {
    case 'pendingReview':
      return '审核中'
    case 'published':
      return '更新上架规则'
    case 'rejected':
      return '重新提交审核'
    default:
      return '提交审核'
  }
})

const submitDisabled = computed(() => {
  return draftStatus.value === 'pendingReview' || saving.value || uploadingCover.value || uploadingScreenshot.value
})

function backToCenter() {
  void router.push('/creation-center')
}

/**
 * BE 返回的图片 URL 形如 /static/rule-images/<uuid>.<ext>，是相对路径。
 * 直接放进 <img src> 在 dev 模式（vite proxy）下能拿到，但在 prod 下需要拼上 API 域。
 * 这里复用 getApiUrl 让两种环境都能正确显示。
 */
function resolveImageUrl(url: string) {
  if (!url) return ''
  if (/^(https?:|data:)/i.test(url)) {
    return url
  }
  return getApiUrl(url)
}

async function loadDraft() {
  const routeDraftId = typeof route.params.draftId === 'string' ? route.params.draftId : ''
  if (!routeDraftId || routeDraftId === 'new') {
    ElMessage.error('找不到对应的草稿')
    await router.replace('/creation-center')
    return
  }

  loading.value = true
  const result = await ruleApi.getDraft(routeDraftId)
  loading.value = false

  if (!result.success || !result.data) {
    ElMessage.error(result.message || '规则草稿加载失败')
    await router.replace('/creation-center')
    return
  }

  draftId.value = result.data.id
  ruleName.value = result.data.name || ''
  playerCount.value = result.data.playerCount || 0
  description.value = result.data.description || ''
  draftStatus.value = (result.data.status as RuleDraftStatus) || 'draft'
  rejectReason.value = result.data.rejectReason || ''
  introduction.value = result.data.introduction || ''
  coverUrl.value = result.data.coverUrl || ''
  screenshotUrls.value = Array.isArray(result.data.screenshotUrls) ? [...result.data.screenshotUrls] : []
  cachedDesign = result.data.design
}

function validateImageFile(file: File | undefined): file is File {
  if (!file) {
    return false
  }
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    ElMessage.warning('仅支持 PNG / JPEG / WEBP 格式的图片')
    return false
  }
  if (file.size > MAX_IMAGE_BYTES) {
    ElMessage.warning('图片大小不能超过 4MB')
    return false
  }
  return true
}

async function handleCoverChange(file: UploadFile) {
  const raw = file.raw
  if (!validateImageFile(raw)) {
    return
  }
  if (!draftId.value) {
    ElMessage.error('草稿尚未加载完成')
    return
  }

  uploadingCover.value = true
  const previousCover = coverUrl.value
  const upload = await ruleApi.uploadRuleImage(draftId.value, raw)
  if (!upload.success || !upload.data?.imageUrl) {
    uploadingCover.value = false
    ElMessage.error(upload.message || '封面上传失败')
    return
  }
  coverUrl.value = upload.data.imageUrl

  const persistOk = await persistDraft({ showSuccess: false })
  uploadingCover.value = false
  if (!persistOk) {
    // 上传图片到 BE 已成功（短 URL 已落盘），但把短 URL 写回 draft 失败，
    // 这种情况回滚 FE 字段，避免用户以为已保存，离开后再回来发现没绑上封面。
    coverUrl.value = previousCover
    return
  }
  ElMessage.success('封面已更新')
}

async function handleScreenshotChange(file: UploadFile) {
  const raw = file.raw
  if (!validateImageFile(raw)) {
    return
  }
  if (!draftId.value) {
    ElMessage.error('草稿尚未加载完成')
    return
  }
  if (screenshotUrls.value.length >= MAX_SCREENSHOTS) {
    ElMessage.warning(`最多 ${MAX_SCREENSHOTS} 张截图`)
    return
  }

  uploadingScreenshot.value = true
  const upload = await ruleApi.uploadRuleImage(draftId.value, raw)
  if (!upload.success || !upload.data?.imageUrl) {
    uploadingScreenshot.value = false
    ElMessage.error(upload.message || '截图上传失败')
    return
  }
  const previousList = [...screenshotUrls.value]
  screenshotUrls.value = [...previousList, upload.data.imageUrl]

  const persistOk = await persistDraft({ showSuccess: false })
  uploadingScreenshot.value = false
  if (!persistOk) {
    screenshotUrls.value = previousList
    return
  }
  ElMessage.success('截图已添加')
}

async function clearCover() {
  if (!coverUrl.value || uploadingCover.value) return
  const previous = coverUrl.value
  coverUrl.value = ''
  uploadingCover.value = true
  const persistOk = await persistDraft({ showSuccess: false })
  uploadingCover.value = false
  if (!persistOk) {
    coverUrl.value = previous
    return
  }
  ElMessage.success('封面已移除')
}

async function removeScreenshot(index: number) {
  if (uploadingScreenshot.value) return
  const previous = [...screenshotUrls.value]
  const next = [...previous]
  next.splice(index, 1)
  screenshotUrls.value = next
  uploadingScreenshot.value = true
  const persistOk = await persistDraft({ showSuccess: false })
  uploadingScreenshot.value = false
  if (!persistOk) {
    screenshotUrls.value = previous
    return
  }
  ElMessage.success('截图已移除')
}

interface PersistOptions {
  showSuccess?: boolean
}

async function persistDraft(options: PersistOptions = {}): Promise<boolean> {
  if (!draftId.value) {
    ElMessage.error('草稿尚未加载完成')
    return false
  }
  // updateDraft 需要 design 字段，沿用进入页面时拉到的 design 不动。
  // PublishFormView 不修改规则结构，所以这里安全。
  if (!cachedDesign) {
    ElMessage.error('规则结构丢失，请回到创作中心重新编辑')
    return false
  }
  const result = await ruleApi.updateDraft(draftId.value, {
    name: ruleName.value,
    playerCount: playerCount.value,
    description: description.value,
    design: cachedDesign as never,
    introduction: introduction.value,
    coverUrl: coverUrl.value,
    screenshotUrls: screenshotUrls.value,
  })
  if (!result.success) {
    ElMessage.error(result.message || '草稿保存失败')
    return false
  }
  if (options.showSuccess) {
    ElMessage.success('草稿已保存')
  }
  return true
}

async function saveDraft() {
  if (saving.value) return
  saving.value = true
  await persistDraft({ showSuccess: true })
  saving.value = false
}

async function submitForReview() {
  if (submitting.value || submitDisabled.value) return
  submitting.value = true
  const persistOk = await persistDraft({ showSuccess: false })
  if (!persistOk) {
    submitting.value = false
    return
  }
  const result = await ruleApi.submitReview(draftId.value)
  submitting.value = false
  if (!result.success || !result.data) {
    ElMessage.error(result.message || '规则提交审核失败')
    return
  }
  draftStatus.value = (result.data.status as RuleDraftStatus) || 'pendingReview'
  rejectReason.value = ''
  ElMessage.success('规则已提交审核，请等待审核员处理')
}

onMounted(() => {
  void loadDraft()
})
</script>

<style scoped>
.publish-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f6fa;
  color: #252633;
  text-align: left;
}

.publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
  padding: 22px 24px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.publish-header h1 {
  margin: 0;
  font-size: 26px;
}

.rule-name {
  margin: 6px 0 0;
  color: #4a5063;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.reject-banner {
  margin-bottom: 16px;
  padding: 12px 16px;
  border: 1px solid #f3c4c4;
  border-radius: 8px;
  background: #fdecec;
  color: #b42323;
  font-size: 14px;
}

.publish-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
}

.card {
  padding: 22px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.card h2 {
  margin: 0 0 6px;
  font-size: 18px;
}

.muted {
  color: #6b7180;
  font-size: 13px;
}

.cover-card .cover-area {
  display: grid;
  grid-template-columns: 240px auto;
  gap: 16px;
  margin-top: 14px;
  align-items: start;
}

.cover-preview {
  width: 240px;
  height: 140px;
  border-radius: 8px;
  border: 1px dashed #c8cdd9;
  background: #f8f9fc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #8a90a0;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.text-btn {
  padding: 0;
  border: 0;
  background: transparent;
  color: #b42323;
}

.text-btn:hover,
.text-btn:focus {
  background: transparent;
  color: #8a1c1c;
}

.shots-card {
  grid-column: 1 / -1;
}

.shots-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.shots-empty {
  margin-top: 12px;
}

.shots-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.shot-item {
  position: relative;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fbfcfe;
  overflow: hidden;
}

.shot-item img {
  display: block;
  width: 100%;
  height: 110px;
  object-fit: cover;
}

.shot-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 0;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.shot-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .publish-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .cover-card .cover-area {
    grid-template-columns: minmax(0, 1fr);
  }

  .cover-preview {
    width: 100%;
  }
}
</style>
