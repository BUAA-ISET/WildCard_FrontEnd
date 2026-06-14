<template>
  <div class="replay-page">
    <section class="replay-header">
      <button class="icon-btn" title="返回历史对局" @click="backToHistory">←</button>
      <div v-if="replay">
        <p class="eyebrow">Replay</p>
        <h1>{{ replay.record.ruleName }}</h1>
      </div>
      <div class="header-spacer"></div>
    </section>

    <section v-if="loading" class="empty-state">正在加载回放...</section>
    <section v-else-if="!replay || !currentFrame" class="empty-state">回放不存在</section>

    <section v-else class="replay-shell">
      <div class="summary-bar">
        <div>
          <span>房间</span>
          <strong>{{ replay.record.roomCode }}</strong>
        </div>
        <div>
          <span>时间</span>
          <strong>{{ elapsedText(currentFrame.elapsedSeconds) }}</strong>
        </div>
        <div>
          <span>进度</span>
          <strong>{{ currentFrame.index + 1 }}/{{ replay.frames.length }}</strong>
        </div>
      </div>

      <section class="table-zone">
        <div class="played-cards">
          <div
            v-for="card in currentFrame.tableCards"
            :key="card.id"
            class="game-card table-card"
            :class="themeClass(card.display.suit)"
            :style="frontCardStyle"
          >
            <div class="card-corner">
              <span>{{ card.display.rank }}</span>
              <span>{{ card.display.suit }}</span>
            </div>
            <div class="card-center">{{ card.display.suit }}</div>
          </div>
          <div v-if="currentFrame.tableCards.length === 0" class="table-empty">桌面暂无出牌</div>
        </div>
      </section>

      <section class="players-zone">
        <article
          v-for="player in replay.record.players"
          :key="player.id"
          class="player-panel"
          :class="{ active: currentFrame.currentPlayerId === player.id }"
        >
          <div class="player-line">
            <img
              :src="resolveAvatarUrl(player.avatar)"
              :alt="player.username"
              class="player-avatar"
            >
            <div>
              <strong>{{ player.username }}</strong>
              <span>{{ player.id === currentFrame.currentPlayerId ? '当前回合' : '等待中' }}</span>
            </div>
          </div>
          <div class="hand-cards">
            <div
              v-for="card in currentFrame.hands[player.id] || []"
              :key="card.id"
              class="game-card hand-card"
              :class="themeClass(card.display.suit)"
              :style="frontCardStyle"
            >
              <div class="card-corner">
                <span>{{ card.display.rank }}</span>
                <span>{{ card.display.suit }}</span>
              </div>
              <div class="card-center">{{ card.display.suit }}</div>
            </div>
            <span v-if="(currentFrame.hands[player.id] || []).length === 0" class="no-card">无可见手牌</span>
          </div>
        </article>
      </section>

      <section class="timeline-panel">
        <div class="timeline-actions">
          <button class="step-btn" :disabled="frameIndex === 0" @click="prevFrame">上一步</button>
          <input
            v-model.number="frameIndex"
            type="range"
            min="0"
            :max="Math.max(replay.frames.length - 1, 0)"
            step="1"
          >
          <button class="step-btn" :disabled="frameIndex >= replay.frames.length - 1" @click="nextFrame">下一步</button>
        </div>
        <div class="action-text">
          {{ currentFrame.action?.message || '对局开始，等待第一步操作' }}
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { replayApi, type MatchReplay } from '../api/replay'
import { resolveAvatarUrl } from '../utils/avatar'

type CardStyle = {
  fontFamily: string
  theme: string
  frontImage: string
}

const route = useRoute()
const router = useRouter()
const replay = ref<MatchReplay | null>(null)
const loading = ref(false)
const frameIndex = ref(0)
const storageKey = 'wildcard-card-style'

const defaultCardStyle: CardStyle = {
  fontFamily: 'Arial, sans-serif',
  theme: 'classic',
  frontImage: '',
}

function readCardStyle(): CardStyle {
  const savedStyle = localStorage.getItem(storageKey)
  if (!savedStyle) {
    return defaultCardStyle
  }

  try {
    return {
      ...defaultCardStyle,
      ...JSON.parse(savedStyle),
    }
  } catch {
    return defaultCardStyle
  }
}

const cardStyle = readCardStyle()

const currentFrame = computed(() => replay.value?.frames[frameIndex.value] || null)

const frontCardStyle = computed(() => ({
  fontFamily: cardStyle.fontFamily,
  backgroundImage: cardStyle.frontImage ? `url(${cardStyle.frontImage})` : 'none',
  backgroundSize: cardStyle.frontImage ? 'cover' : 'initial',
}))

function themeClass(suit: string) {
  const colorClass = suit === 'H' || suit === 'D' ? 'red-card' : 'black-card'
  return `${colorClass} theme-${cardStyle.theme}`
}

function elapsedText(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function prevFrame() {
  frameIndex.value = Math.max(frameIndex.value - 1, 0)
}

function nextFrame() {
  frameIndex.value = Math.min(frameIndex.value + 1, Math.max((replay.value?.frames.length || 1) - 1, 0))
}

async function loadReplay() {
  const replayId = String(route.params.replayId || '')
  if (!replayId) {
    return
  }

  loading.value = true
  const result = await replayApi.getReplay(replayId)
  loading.value = false

  if (!result.success || !result.data) {
    ElMessage.error(result.message || '回放加载失败')
    return
  }

  replay.value = result.data
  frameIndex.value = 0
}

async function backToHistory() {
  await router.push('/match-history')
}

onMounted(() => {
  void loadReplay()
})
</script>

<style scoped>
.replay-page {
  min-height: 100%;
  padding: 24px;
  background: #f5f6fa;
  color: #242833;
  text-align: left;
}

.replay-header {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border: 1px solid #c7cfdb;
  border-radius: 6px;
  background: #fff;
  color: #263142;
  font-size: 1.2rem;
  cursor: pointer;
}

.header-spacer {
  width: 38px;
}

.eyebrow {
  color: #606a7b;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-align: center;
  text-transform: uppercase;
}

h1 {
  margin: 4px 0 0;
  color: #151922;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0;
  text-align: center;
}

.replay-shell {
  display: grid;
  grid-template-rows: auto minmax(210px, 1fr) auto auto;
  gap: 16px;
}

.summary-bar,
.timeline-panel,
.player-panel {
  border: 1px solid #d7dbe4;
  border-radius: 8px;
  background: #fff;
}

.summary-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 18px;
}

.summary-bar div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-bar span,
.player-line span,
.no-card {
  color: #657184;
  font-size: 0.82rem;
}

.summary-bar strong,
.player-line strong {
  color: #151922;
  font-size: 1rem;
}

.table-zone {
  display: grid;
  place-items: center;
  min-height: 220px;
}

.played-cards,
.hand-cards {
  display: flex;
  justify-content: center;
}

.played-cards .game-card,
.hand-cards .game-card {
  margin-left: -18px;
}

.played-cards .game-card:first-child,
.hand-cards .game-card:first-child {
  margin-left: 0;
}

.table-empty {
  color: #7b8494;
}

.players-zone {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.player-panel {
  padding: 16px;
}

.player-panel.active {
  border-color: #8d79d6;
  box-shadow: 0 0 0 3px rgba(141, 121, 214, 0.18);
}

.player-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.player-line div:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.player-avatar {
  width: 48px;
  height: 48px;
  display: block;
  border-radius: 50%;
  background: #dadde5;
  object-fit: cover;
}

.timeline-panel {
  padding: 16px;
}

.timeline-actions {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
}

.timeline-actions input {
  width: 100%;
}

.step-btn {
  height: 36px;
  border: 1px solid #bfc6d3;
  border-radius: 6px;
  background: #fff;
  color: #263142;
  padding: 0 14px;
  font-weight: 700;
  cursor: pointer;
}

.step-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.action-text {
  margin-top: 12px;
  color: #344054;
  text-align: center;
}

.game-card {
  width: 92px;
  height: 132px;
  border: 2px solid #151515;
  border-radius: 8px;
  background: #fff;
  color: #151515;
  position: relative;
  box-shadow: 0 10px 18px rgba(20, 26, 40, 0.16);
}

.card-corner {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.card-center {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 38px;
  font-weight: 900;
}

.red-card {
  color: #c82424;
}

.black-card {
  color: #171717;
}

.empty-state {
  min-height: 260px;
  display: grid;
  place-items: center;
  border: 1px dashed #c5cbd6;
  border-radius: 8px;
  background: #fff;
  color: #667085;
}

@media (max-width: 760px) {
  .summary-bar,
  .timeline-actions {
    grid-template-columns: 1fr;
  }
}
</style>
