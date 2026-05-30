<template>
  <div class="market-page">
    <header class="market-header">
      <div>
        <h1>规则市场</h1>
        <p>浏览玩家创建的自定义规则。</p>
      </div>
      <el-button class="market-btn" @click="router.push('/creation-center/new')">创建规则</el-button>
    </header>

    <section class="filter-panel">
      <el-input
        v-model="keyword"
        placeholder="搜索规则名或开发者名字"
        clearable
        class="keyword-input"
        @keyup.enter="loadRules"
        @clear="loadRules"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="selectedType" placeholder="规则类型" clearable class="type-select" @change="loadRules">
        <el-option v-for="type in ruleTypes" :key="type" :label="type" :value="type" />
      </el-select>
      <el-button class="market-btn" @click="clearFilters">清空筛选</el-button>
      <el-button class="market-btn" @click="loadRules">搜索</el-button>
    </section>

    <el-skeleton v-if="loading" :rows="5" animated class="market-skeleton" />
    <el-empty v-else-if="rules.length === 0" description="暂无匹配的规则" />
    <main v-else class="rule-grid">
      <article
        v-for="rule in rules"
        :key="rule.id"
        class="rule-card"
        role="button"
        tabindex="0"
        @click="openRule(rule.id)"
        @keydown.enter.prevent="openRule(rule.id)"
      >
        <div class="rule-cover">
          <img v-if="rule.coverUrl" :src="rule.coverUrl" :alt="rule.name">
          <span v-else>{{ rule.type }}</span>
        </div>
        <div class="rule-card-body">
          <div class="rule-title-row">
            <h2>{{ rule.name }}</h2>
            <el-tag size="small">{{ rule.type }}</el-tag>
          </div>
          <p>{{ rule.description }}</p>
          <div class="developer-row">
            <img :src="resolveDeveloperAvatar(rule.developer)" :alt="rule.developer.name">
            <span>{{ rule.developer.name }}</span>
          </div>
          <div class="card-footer">
            <el-rate :model-value="rule.rating" disabled allow-half size="small" />
            <span>{{ rule.rating.toFixed(1) }} · {{ rule.reviewCount }} 条评价</span>
            <span>{{ formatDate(rule.publishedAt) }}</span>
          </div>
          <div class="card-actions">
            <button
              class="market-btn fork-btn"
              type="button"
              @click.stop="handleFork(rule)"
              @keydown.enter.stop.prevent="handleFork(rule)"
            >
              Fork
            </button>
          </div>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { marketApi, resolveDeveloperAvatar, type PublishedRuleSummary } from '../api/market'
import { useRuleFork } from '../composables/useRuleFork'

const router = useRouter()
const loading = ref(false)
const keyword = ref('')
const selectedType = ref('')
const rules = ref<PublishedRuleSummary[]>([])
const { forkRule } = useRuleFork()

function handleFork(rule: PublishedRuleSummary) {
  void forkRule(rule)
}

const ruleTypes = computed(() => Array.from(new Set(rules.value.map((rule) => rule.type))).filter(Boolean))

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

async function loadRules() {
  loading.value = true
  const result = await marketApi.listPublishedRules({
    keyword: keyword.value,
    type: selectedType.value,
  })
  loading.value = false

  if (!result.success) {
    ElMessage.error(result.message || '规则市场加载失败')
    return
  }

  rules.value = result.data || []
}

function clearFilters() {
  keyword.value = ''
  selectedType.value = ''
  void loadRules()
}

function openRule(ruleId: string) {
  void router.push(`/rule-market/${encodeURIComponent(ruleId)}`)
}

onMounted(() => {
  void loadRules()
})
</script>

<style scoped>
.market-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f6fa;
  color: #252633;
  text-align: left;
}

.market-header,
.filter-panel,
.rule-card {
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.market-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  margin-bottom: 16px;
}

.market-header h1 {
  margin: 0;
  font-size: 26px;
  letter-spacing: 0;
}

.market-header p {
  margin-top: 6px;
  color: #4a5063;
}

.filter-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px auto auto;
  gap: 12px;
  align-items: center;
  padding: 16px;
  margin-bottom: 16px;
}

.keyword-input {
  width: 100%;
}

.type-select {
  width: 180px;
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

.market-skeleton {
  padding: 24px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.rule-card {
  display: grid;
  grid-template-rows: 150px minmax(0, 1fr);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.rule-card:hover {
  border-color: #7b8cff;
  box-shadow: 0 8px 22px rgba(42, 55, 120, 0.08);
}

.rule-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef1f7;
  color: #3a4050;
  font-weight: 700;
}

.rule-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rule-card-body {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.rule-title-row,
.developer-row,
.card-footer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rule-title-row {
  justify-content: space-between;
}

.rule-title-row h2 {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0;
}

.rule-card-body p {
  min-height: 44px;
  color: #4a5063;
  line-height: 1.55;
}

.developer-row img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.card-footer {
  flex-wrap: wrap;
  color: #4a5063;
  font-size: 13px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}

.fork-btn {
  min-width: 80px;
  padding: 6px 16px;
}

@media (max-width: 760px) {
  .market-page {
    padding: 18px;
  }

  .market-header,
  .filter-panel {
    align-items: stretch;
    display: flex;
    flex-direction: column;
  }

  .keyword-input,
  .type-select {
    width: 100%;
    max-width: none;
  }
}
</style>
