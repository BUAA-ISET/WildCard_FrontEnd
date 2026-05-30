<template>
  <div class="detail-page">
    <el-skeleton v-if="loading" :rows="8" animated class="panel" />
    <template v-else-if="rule">
      <header class="detail-header">
        <div>
          <div class="title-line">
            <h1>{{ rule.name }}</h1>
            <el-tag>{{ rule.type }}</el-tag>
          </div>
          <div class="rating-line">
            <el-rate :model-value="rule.rating" disabled allow-half />
            <span>{{ rule.rating.toFixed(1) }} 分 · {{ rule.reviewCount }} 条评价</span>
          </div>
        </div>
        <button type="button" class="developer-card" @click="openDeveloper">
          <img :src="resolveDeveloperAvatar(rule.developer)" :alt="rule.developer.name">
          <strong>{{ rule.developer.name }}</strong>
        </button>
      </header>

      <main class="detail-grid">
        <section class="screenshot-panel panel">
          <img v-if="activeScreenshot" :src="activeScreenshot" :alt="rule.name">
          <div v-else class="screenshot-placeholder">{{ rule.type }}</div>
        </section>
        <section class="intro-panel panel">
          <h2>玩法介绍</h2>
          <p>{{ rule.introduction || rule.description }}</p>
          <div class="action-row">
            <el-button class="market-btn" @click="router.push(`/rule-market/${encodeURIComponent(rule.id)}/rooms`)">搜索房间</el-button>
            <el-button class="market-btn" @click="quickCreateRoom">快速使用规则</el-button>
            <el-button class="market-btn" @click="handleFork">Fork 规则</el-button>
          </div>
        </section>
      </main>

      <section class="review-panel panel">
        <h2>评分与评论</h2>
        <div class="review-form">
          <el-rate v-model="reviewRating" />
          <el-input v-model="reviewContent" type="textarea" :rows="3" placeholder="写下你的体验" />
          <div class="upload-row">
            <el-upload
              :auto-upload="false"
              :limit="1"
              accept="image/*"
              :show-file-list="false"
              :on-change="handleImageChange"
              :on-remove="clearReviewImage"
            >
              <el-button class="market-btn">上传图片</el-button>
            </el-upload>
            <span v-if="reviewImageName" class="upload-name">{{ reviewImageName }}</span>
            <el-button v-if="reviewImageUrl" class="text-btn" @click="clearReviewImage">移除</el-button>
            <el-button class="market-btn submit-btn" :loading="submitting" @click="submitReview">提交评论</el-button>
          </div>
          <img v-if="reviewImageUrl" :src="reviewImageUrl" alt="评论图片预览" class="upload-preview">
        </div>
        <el-empty v-if="rule.reviews.length === 0" description="暂无评论" />
        <article v-for="review in rule.reviews" v-else :key="review.id" class="review-item">
          <img :src="review.authorAvatar" :alt="review.authorName" class="review-avatar">
          <div>
            <div class="review-meta">
              <strong>{{ review.authorName }}</strong>
              <el-rate :model-value="review.rating" disabled size="small" />
              <span>{{ formatDate(review.createdAt) }}</span>
            </div>
            <p>{{ review.content }}</p>
            <img v-if="review.imageUrl" :src="review.imageUrl" :alt="review.content" class="review-image">
          </div>
        </article>
      </section>
    </template>
    <el-empty v-else description="规则不存在" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { marketApi, resolveDeveloperAvatar, type PublishedRuleDetail } from '../api/market'
import { useRuleFork } from '../composables/useRuleFork'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const rule = ref<PublishedRuleDetail | null>(null)
const reviewRating = ref(5)
const reviewContent = ref('')
const reviewImageUrl = ref('')
const reviewImageName = ref('')
const reviewImageFile = ref<File | null>(null)
const { forkRule } = useRuleFork()

function handleFork() {
  if (!rule.value) {
    return
  }
  void forkRule({ id: rule.value.id, name: rule.value.name })
}

const ruleId = computed(() => String(route.params.ruleId || ''))
const activeScreenshot = computed(() => rule.value?.screenshots[0] || rule.value?.coverUrl || '')

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadRule() {
  loading.value = true
  const result = await marketApi.getPublishedRuleDetail(ruleId.value)
  loading.value = false

  if (!result.success) {
    ElMessage.error(result.message || '规则详情加载失败')
    return
  }

  rule.value = result.data || null
}

function openDeveloper() {
  if (!rule.value) {
    return
  }
  void router.push(`/rule-market/developer/${encodeURIComponent(rule.value.developer.id)}`)
}

function quickCreateRoom() {
  if (!rule.value) {
    return
  }
  void router.push({
    path: '/create-room',
    query: {
      ruleId: rule.value.id,
      ruleName: rule.value.name,
    },
  })
}

async function submitReview() {
  if (!rule.value || !reviewContent.value.trim()) {
    ElMessage.warning('请填写评论内容')
    return
  }

  submitting.value = true

  // 先上传图片（如果有），再带短 URL 发评论。
  let uploadedImageUrl: string | undefined
  if (reviewImageFile.value) {
    const upload = await marketApi.uploadReviewImage(reviewImageFile.value)
    if (!upload.success || !upload.data) {
      submitting.value = false
      ElMessage.error(upload.message || '图片上传失败')
      return
    }
    uploadedImageUrl = upload.data.imageUrl
  }

  const result = await marketApi.postRuleReview(rule.value.id, {
    rating: reviewRating.value,
    content: reviewContent.value.trim(),
    imageUrl: uploadedImageUrl,
  })
  submitting.value = false

  if (!result.success || !result.data) {
    ElMessage.error(result.message || '评论提交失败')
    return
  }

  rule.value.reviews = [result.data, ...rule.value.reviews]
  reviewContent.value = ''
  clearReviewImage()
  ElMessage.success('评论已提交')
}

function handleImageChange(file: UploadFile) {
  const rawFile = file.raw
  if (!rawFile) {
    return
  }

  if (!rawFile.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件')
    return
  }

  // 保留原 File 给提交时上传；同时读 dataURL 仅用于本地预览。
  reviewImageFile.value = rawFile
  reviewImageName.value = rawFile.name
  const reader = new FileReader()
  reader.onload = () => {
    reviewImageUrl.value = typeof reader.result === 'string' ? reader.result : ''
  }
  reader.readAsDataURL(rawFile)
}

function clearReviewImage() {
  reviewImageUrl.value = ''
  reviewImageName.value = ''
  reviewImageFile.value = null
}

onMounted(() => {
  void loadRule()
})
</script>

<style scoped>
.detail-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f6fa;
  color: #252633;
  text-align: left;
}

.panel,
.detail-header {
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  margin-bottom: 16px;
}

.title-line,
.rating-line,
.action-row,
.review-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title-line h1 {
  margin: 0;
  font-size: 26px;
  letter-spacing: 0;
}

.rating-line {
  margin-top: 8px;
  color: #687083;
}

.developer-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
  padding: 12px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fbfcfe;
  color: #252633;
  text-align: left;
  cursor: pointer;
}

.developer-card img,
.review-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 16px;
  margin-bottom: 16px;
}

.screenshot-panel {
  min-height: 320px;
  overflow: hidden;
}

.screenshot-panel img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.screenshot-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 320px;
  background: #eef1f7;
  color: #4f5665;
  font-size: 28px;
  font-weight: 700;
}

.intro-panel,
.review-panel {
  padding: 22px;
}

.intro-panel h2,
.review-panel h2 {
  margin: 0 0 14px;
  font-size: 20px;
  letter-spacing: 0;
}

.intro-panel p {
  color: #687083;
  line-height: 1.8;
  margin-bottom: 20px;
}

.review-form {
  display: grid;
  gap: 12px;
  max-width: 720px;
  margin-bottom: 18px;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-name {
  color: #687083;
  font-size: 14px;
}

.upload-preview {
  width: 180px;
  max-height: 120px;
  border-radius: 8px;
  border: 1px solid #dfe3ec;
  object-fit: cover;
}

.market-btn {
  min-width: 96px;
  padding: 10px 22px;
  border: 2px solid #222;
  border-radius: 10px;
  background: #fff;
  color: #222;
  font-weight: 600;
}

.market-btn:hover,
.market-btn:focus {
  border-color: #222;
  background: #ece6fa;
  color: #222;
}

.submit-btn {
  width: fit-content;
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

.review-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid #edf0f5;
}

.review-meta {
  color: #687083;
  font-size: 13px;
}

.review-meta strong {
  color: #252633;
  font-size: 15px;
}

.review-item p {
  margin-top: 8px;
  color: #3c4351;
  line-height: 1.65;
}

.review-image {
  max-width: 240px;
  max-height: 160px;
  margin-top: 10px;
  border-radius: 8px;
  object-fit: cover;
}

@media (max-width: 900px) {
  .detail-header,
  .detail-grid {
    display: flex;
    flex-direction: column;
  }

  .developer-card {
    width: 100%;
  }
}
</style>
