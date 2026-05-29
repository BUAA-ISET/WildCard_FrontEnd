<template>
  <div class="room-search-page">
    <header class="room-header">
      <div>
        <h1>{{ ruleTitle }}</h1>
        <p>当前在线房间 {{ rooms.length }} 个</p>
      </div>
      <el-button class="market-btn" @click="createRoom">快速创建房间</el-button>
    </header>

    <el-skeleton v-if="loading" :rows="6" animated class="panel" />
    <el-empty v-else-if="rooms.length === 0" description="暂无正在游玩的房间" />
    <main v-else class="room-grid">
      <article v-for="room in rooms" :key="room.id" class="room-card">
        <div class="room-card-head">
          <div>
            <h2>{{ room.code }}</h2>
            <p>房主：{{ room.hostName }}</p>
          </div>
          <el-tag :type="room.status === 'waiting' ? 'primary' : 'info'" size="small">
            {{ room.status === 'waiting' ? '等待中' : '游戏中' }}
          </el-tag>
        </div>
        <div class="room-info-grid">
          <div class="room-info-item">
            <span>人数</span>
            <strong>{{ room.currentPlayers }} / {{ room.maxPlayers }}</strong>
          </div>
          <div class="room-info-item">
            <span>密码</span>
            <strong class="password-state">
              <el-icon>
                <Lock v-if="room.hasPassword" />
                <Unlock v-else />
              </el-icon>
              {{ room.hasPassword ? '需要' : '无' }}
            </strong>
          </div>
        </div>
        <el-button class="market-btn join-btn" :disabled="room.status !== 'waiting'" @click="joinRoom(room.code)">加入</el-button>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { marketApi, type RuleRoom } from '../api/market'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const rooms = ref<RuleRoom[]>([])
const ruleTitle = ref('规则房间')
const ruleId = computed(() => String(route.params.ruleId || ''))

async function loadRooms() {
  loading.value = true
  const [roomResult, detailResult] = await Promise.all([
    marketApi.listRuleRooms(ruleId.value),
    marketApi.getPublishedRuleDetail(ruleId.value),
  ])
  loading.value = false

  if (detailResult.success && detailResult.data) {
    ruleTitle.value = detailResult.data.name
  }

  if (!roomResult.success) {
    ElMessage.error(roomResult.message || '房间列表加载失败')
    return
  }

  rooms.value = roomResult.data || []
}

function createRoom() {
  void router.push({
    path: '/create-room',
    query: {
      ruleId: ruleId.value,
      ruleName: ruleTitle.value,
    },
  })
}

function joinRoom(code: string) {
  void router.push({
    path: '/join-room',
    query: { code },
  })
}

onMounted(() => {
  void loadRooms()
})
</script>

<style scoped>
.room-search-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f6fa;
  color: #252633;
  text-align: left;
}

.room-header,
.room-card,
.panel {
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  margin-bottom: 16px;
}

.room-header h1 {
  margin: 0;
  font-size: 26px;
  letter-spacing: 0;
}

.room-header p {
  margin-top: 6px;
  color: #687083;
}

.panel {
  padding: 24px;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.room-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 20px;
}

.room-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.room-card h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0;
}

.room-card p {
  margin-top: 6px;
  color: #687083;
}

.room-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.room-info-item {
  padding: 12px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fbfcfe;
}

.room-info-item span {
  display: block;
  margin-bottom: 6px;
  color: #687083;
  font-size: 14px;
}

.room-info-item strong,
.password-state {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #252633;
  font-size: 16px;
}

.join-btn {
  width: 100%;
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

.market-btn.is-disabled,
.market-btn.is-disabled:hover {
  border-color: #c8c8c8;
  background: #f5f5f5;
  color: #999;
}

@media (max-width: 760px) {
  .room-header {
    display: flex;
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
