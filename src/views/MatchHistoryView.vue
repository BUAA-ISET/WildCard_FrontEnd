<template>
  <div class="history-page">
    <section class="history-header">
      <div>
        <p class="eyebrow">Match History</p>
        <h1>历史对局</h1>
      </div>
      <button class="refresh-btn" :disabled="loading" @click="loadHistory">刷新</button>
    </section>

    <section v-if="loading" class="empty-state">正在加载对局记录...</section>
    <section v-else-if="records.length === 0" class="empty-state">暂无对局记录</section>

    <section v-else class="history-list">
      <article v-for="record in records" :key="record.id" class="history-card">
        <div class="result-mark" :class="record.result">{{ resultText(record.result) }}</div>
        <div class="record-main">
          <div class="record-title">
            <strong>{{ record.ruleName }}</strong>
            <span>{{ formatDate(record.startedAt) }}</span>
          </div>
          <div class="record-meta">
            <span>房间 {{ record.roomCode }}</span>
            <span>玩家 {{ playerNames(record) }}</span>
          </div>
        </div>
        <button class="replay-btn" @click="openReplay(record.id)">查看回放</button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { replayApi, type MatchHistoryRecord } from '../api/replay'

const router = useRouter()
const loading = ref(false)
const records = ref<MatchHistoryRecord[]>([])

function resultText(result: MatchHistoryRecord['result']) {
  if (result === 'win') {
    return '胜'
  }
  if (result === 'lose') {
    return '负'
  }
  return '平'
}

function formatDate(value: string) {
  if (!value) {
    return '时间未知'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function playerNames(record: MatchHistoryRecord) {
  return record.players.map((player) => player.username).join('、')
}

async function loadHistory() {
  loading.value = true
  const result = await replayApi.getHistory()
  loading.value = false

  if (!result.success || !result.data) {
    ElMessage.error(result.message || '对局历史加载失败')
    return
  }

  records.value = result.data
}

async function openReplay(replayId: string) {
  await router.push(`/match-history/${encodeURIComponent(replayId)}`)
}

onMounted(() => {
  void loadHistory()
})
</script>

<style scoped>
.history-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f6fa;
  color: #242833;
  text-align: left;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.eyebrow {
  color: #606a7b;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 4px 0 0;
  color: #151922;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 0;
}

.refresh-btn,
.replay-btn {
  height: 38px;
  border: 1px solid #bfc6d3;
  border-radius: 6px;
  background: #fff;
  color: #263142;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  align-items: center;
  gap: 18px;
  min-height: 88px;
  border: 1px solid #d7dbe4;
  border-radius: 8px;
  background: #fff;
  padding: 16px 18px;
}

.result-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-weight: 900;
}

.result-mark.win {
  background: #e7f8ef;
  color: #137642;
}

.result-mark.lose {
  background: #fff0f0;
  color: #aa2626;
}

.result-mark.draw {
  background: #eef1f6;
  color: #5b6575;
}

.record-main {
  min-width: 0;
}

.record-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.record-title strong {
  color: #151922;
  font-size: 1.06rem;
}

.record-title span,
.record-meta {
  color: #647084;
  font-size: 0.88rem;
}

.record-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.replay-btn {
  border-color: #8d79d6;
  background: #f2effc;
  color: #4b3a91;
}

.empty-state {
  min-height: 220px;
  display: grid;
  place-items: center;
  border: 1px dashed #c5cbd6;
  border-radius: 8px;
  background: #fff;
  color: #667085;
}

@media (max-width: 720px) {
  .history-card {
    grid-template-columns: 48px 1fr;
  }

  .replay-btn {
    grid-column: 1 / -1;
  }
}
</style>
