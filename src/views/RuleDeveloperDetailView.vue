<template>
  <div class="developer-page">
    <header class="developer-header">
      <img :src="developerAvatar" :alt="developerName">
      <div>
        <h1>{{ developerName }}</h1>
        <p>{{ developerBio }}</p>
      </div>
    </header>

    <section class="search-panel">
      <el-input
        v-model="keyword"
        placeholder="搜索该开发者发布的规则"
        clearable
        @keyup.enter="loadRules"
        @clear="loadRules"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button class="market-btn" @click="loadRules">搜索</el-button>
    </section>

    <el-skeleton v-if="loading" :rows="6" animated class="panel" />
    <el-empty v-else-if="rules.length === 0" description="暂无规则" />
    <main v-else class="rule-list">
      <article
        v-for="rule in rules"
        :key="rule.id"
        class="rule-row"
        role="button"
        tabindex="0"
        @click="openRule(rule.id)"
        @keydown.enter.prevent="openRule(rule.id)"
      >
        <div>
          <h2>{{ rule.name }}</h2>
          <p>{{ rule.description }}</p>
        </div>
        <div class="rule-meta">
          <el-tag size="small">{{ rule.type }}</el-tag>
          <el-rate :model-value="rule.rating" disabled allow-half size="small" />
          <span>{{ rule.rating.toFixed(1) }} 分</span>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import defaultAvatarUrl from '../assets/default-avatar.svg'
import { marketApi, type PublishedRuleSummary } from '../api/market'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const keyword = ref('')
const rules = ref<PublishedRuleSummary[]>([])

const developerId = computed(() => String(route.params.developerId || ''))
const firstRule = computed(() => rules.value[0])
const developerName = computed(() => firstRule.value?.developer.name || '开发者')
const developerAvatar = computed(() => firstRule.value?.developer.avatar || defaultAvatarUrl)
const developerBio = computed(() => firstRule.value?.developer.bio || '该开发者还没有留下简介。')

async function loadRules() {
  loading.value = true
  const result = await marketApi.listDeveloperRules(developerId.value, { keyword: keyword.value })
  loading.value = false

  if (!result.success) {
    ElMessage.error(result.message || '开发者规则加载失败')
    return
  }

  rules.value = result.data || []
}

function openRule(ruleId: string) {
  void router.push(`/rule-market/${encodeURIComponent(ruleId)}`)
}

onMounted(() => {
  void loadRules()
})
</script>

<style scoped>
.developer-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f6fa;
  color: #252633;
  text-align: left;
}

.developer-header,
.search-panel,
.rule-row,
.panel {
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.developer-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 16px;
}

.developer-header img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.developer-header h1 {
  margin: 0;
  font-size: 26px;
  letter-spacing: 0;
}

.developer-header p {
  margin-top: 6px;
  color: #687083;
}

.search-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.panel {
  padding: 24px;
}

.rule-list {
  display: grid;
  gap: 12px;
}

.rule-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  cursor: pointer;
}

.rule-row:hover {
  border-color: #7b8cff;
  box-shadow: 0 8px 22px rgba(42, 55, 120, 0.08);
}

.rule-row h2 {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0;
}

.rule-row p {
  margin-top: 6px;
  color: #687083;
  line-height: 1.55;
}

.rule-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #687083;
  font-size: 13px;
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

@media (max-width: 760px) {
  .search-panel,
  .rule-row {
    grid-template-columns: 1fr;
  }

  .rule-meta {
    flex-wrap: wrap;
  }
}
</style>
