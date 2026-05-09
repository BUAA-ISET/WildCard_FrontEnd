<template>
  <div class="battle-page">
    <div v-if="showSettlementNotice" class="settlement-banner">
      <strong>{{ settlementTitle }}</strong>
      <span>{{ settlementMessage }}</span>
    </div>

    <div class="battle-top">
      <div class="battle-tool">
        <label>玩家人数</label>
        <input :value="snapshot?.players.length || 0" type="number" min="2" max="8" disabled>
      </div>
      <div class="opponent-list">
        <div
          v-for="player in opponents"
          :key="player.id"
          class="player-card"
          :class="{ active: currentTurnPlayerId === player.id }"
        >
          <div class="player-avatar">{{ player.name }}</div>
          <div class="mini-back" :style="backCardStyle">
            <div v-if="!cardStyle.backImage" class="mini-back-inner"></div>
          </div>
          <div class="card-count">{{ player.cardCount }}</div>
        </div>
      </div>
    </div>

    <div class="battle-table">
      <div class="played-cards">
        <div
          v-for="card in tableCards"
          :key="card.id"
          class="game-card table-card"
          :class="themeClass(card.suit)"
          :style="frontCardStyle"
        >
          <div class="card-corner">
            <span>{{ card.rank }}</span>
            <span>{{ card.suit }}</span>
          </div>
          <div class="card-center">{{ card.suit }}</div>
        </div>
      </div>

      <div class="deck-card">
        <div class="deck-back" :style="backCardStyle">
          <div v-if="!cardStyle.backImage" class="back-pattern"></div>
        </div>
      </div>
    </div>

    <div class="user-area">
      <div class="action-panel">
        <button :disabled="!canPlay || actionLoading" @click="playSelectedCards">PLAY</button>
        <button :disabled="!canSkip || actionLoading" @click="skipTurn">SKIP</button>
      </div>

      <div class="user-info" :class="{ active: currentTurnPlayerId === currentPlayerId }">
        <div class="user-avatar">U</div>
        <div class="turn-text">{{ turnText }}</div>
      </div>

      <div class="hand-area">
        <div class="hand-cards">
          <button
            v-for="card in handCards"
            :key="card.id"
            class="game-card hand-card"
            :class="[themeClass(card.suit), { selected: selectedCardIds.includes(card.id) }]"
            :style="frontCardStyle"
            @click="toggleCard(card.id)"
          >
            <div class="card-corner">
              <span>{{ card.rank }}</span>
              <span>{{ card.suit }}</span>
            </div>
            <div class="card-center">{{ card.suit }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { gameApi, type GameSnapshot } from '../api/game'
import { roomApi } from '../api/room'

type CardStyle = {
  fontFamily: string
  theme: string
  frontImage: string
  backImage: string
}

type BattleCard = {
  id: string
  rank: string
  suit: string
}

const route = useRoute()
const router = useRouter()
const storageKey = 'wildcard-card-style'
const currentPlayerId = roomApi.getCurrentPlayerId()
const snapshot = ref<GameSnapshot | null>(null)
const selectedCardIds = ref<string[]>([])
const actionLoading = ref(false)
const isLeavingBattle = ref(false)
const showSettlementNotice = ref(false)
let settlementTimer: number | null = null
let pollingTimer: number | null = null
const SETTLEMENT_REDIRECT_DELAY_MS = 1800

const defaultCardStyle: CardStyle = {
  fontFamily: 'Arial, sans-serif',
  theme: 'classic',
  frontImage: '',
  backImage: ''
}

const readCardStyle = () => {
  const savedStyle = localStorage.getItem(storageKey)

  if (!savedStyle) {
    return defaultCardStyle
  }

  try {
    return {
      ...defaultCardStyle,
      ...JSON.parse(savedStyle)
    }
  } catch {
    return defaultCardStyle
  }
}

const cardStyle = readCardStyle()

const currentTurnPlayerId = computed(() => snapshot.value?.currentPlayerId || '')
const currentActionId = computed(() => snapshot.value?.pendingAction?.actionId || '')
const opponents = computed(() => (
  snapshot.value?.players
    .filter((player) => player.id !== currentPlayerId)
    .map((player) => ({
      id: player.id,
      name: player.username || 'Player',
      cardCount: player.cardCount,
    })) || []
))

const tableCards = computed<BattleCard[]>(() => (
  snapshot.value?.table.playedCards.map((card) => ({
    id: card.id,
    rank: card.display.rank,
    suit: card.display.suit,
  })) || []
))

const handCards = computed<BattleCard[]>(() => (
  snapshot.value?.handCards.map((card) => ({
    id: card.id,
    rank: card.display.rank,
    suit: card.display.suit,
  })) || []
))

const canPlay = computed(() => currentTurnPlayerId.value === currentPlayerId && handCards.value.length > 0)
const canSkip = computed(() => (
  currentTurnPlayerId.value === currentPlayerId
  && Boolean(snapshot.value?.pendingAction?.canSkip)
))
const settlementTitle = computed(() => (
  snapshot.value?.winnerIds.includes(currentPlayerId) ? '对局结束，你获胜了' : '对局结束'
))
const settlementMessage = computed(() => '结算完成，正在返回准备房间...')

const turnText = computed(() => {
  if (!snapshot.value) {
    return '等待对局初始化'
  }
  if (snapshot.value.status === 'finished') {
    if (snapshot.value.winnerIds.includes(currentPlayerId)) {
      return '对局结束，你获胜了'
    }
    return '对局结束'
  }
  if (currentTurnPlayerId.value === currentPlayerId) {
    return snapshot.value.lastAction?.message || '当前轮到你出牌'
  }

  const player = snapshot.value.players.find(item => item.id === currentTurnPlayerId.value)
  return `当前轮到玩家 ${player?.username || 'Unknown'}`
})

const frontCardStyle = computed(() => ({
  fontFamily: cardStyle.fontFamily,
  backgroundImage: cardStyle.frontImage ? `url(${cardStyle.frontImage})` : 'none',
  backgroundSize: cardStyle.frontImage ? 'cover' : 'initial'
}))

const backCardStyle = computed(() => ({
  backgroundImage: cardStyle.backImage ? `url(${cardStyle.backImage})` : 'none',
  backgroundSize: cardStyle.backImage ? 'cover' : 'initial'
}))

const themeClass = (suit: string) => {
  const colorClass = suit === '♥' || suit === '♦' ? 'red-card' : 'black-card'
  return `${colorClass} theme-${cardStyle.theme}`
}

function toggleCard(cardId: string) {
  if (!canPlay.value || actionLoading.value) {
    return
  }

  if (selectedCardIds.value.includes(cardId)) {
    selectedCardIds.value = selectedCardIds.value.filter(id => id !== cardId)
    return
  }

  selectedCardIds.value.push(cardId)
}

async function refreshSnapshot() {
  const roomCode = String(route.params.roomCode || '')
  if (!roomCode || isLeavingBattle.value) {
    return
  }

  const result = await gameApi.getCurrent(roomCode)
  if (isLeavingBattle.value) {
    return
  }

  if (!result.success || !result.data) {
    ElMessage.error(result.message || '无法加载当前对局')
    stopPolling()
    await router.replace(`/game/${roomCode}`)
    return
  }

  snapshot.value = result.data
  selectedCardIds.value = selectedCardIds.value.filter(cardId => (
    result.data?.handCards.some(card => card.id === cardId)
  ))
}

async function returnToReadyRoom() {
  const roomCode = String(route.params.roomCode || '')
  if (!roomCode || isLeavingBattle.value) {
    return
  }

  isLeavingBattle.value = true
  stopPolling()
  await router.replace(`/game/${roomCode}`)
}

function scheduleReadyRoomRedirect() {
  if (settlementTimer !== null || isLeavingBattle.value) {
    return
  }

  showSettlementNotice.value = true
  settlementTimer = window.setTimeout(() => {
    settlementTimer = null
    void returnToReadyRoom()
  }, SETTLEMENT_REDIRECT_DELAY_MS)
}

async function playSelectedCards() {
  if (!snapshot.value) {
    return
  }
  if (selectedCardIds.value.length === 0) {
    ElMessage.error('请先选择要出的牌')
    return
  }

  actionLoading.value = true
  const result = await gameApi.playCards(snapshot.value.sessionId, currentActionId.value, selectedCardIds.value)
  actionLoading.value = false

  if (!result.success || !result.data) {
    ElMessage.error(result.message || '出牌失败')
    return
  }

  snapshot.value = result.data
  selectedCardIds.value = []
}

async function skipTurn() {
  if (!snapshot.value) {
    return
  }

  actionLoading.value = true
  const result = await gameApi.skip(snapshot.value.sessionId, currentActionId.value)
  actionLoading.value = false

  if (!result.success || !result.data) {
    ElMessage.error(result.message || '跳过失败')
    return
  }

  snapshot.value = result.data
  selectedCardIds.value = []
}

function stopPolling() {
  if (pollingTimer !== null) {
    window.clearInterval(pollingTimer)
    pollingTimer = null
  }
}

onMounted(async () => {
  await refreshSnapshot()
  pollingTimer = window.setInterval(() => {
    void refreshSnapshot()
  }, 1500)
})

watch(
  () => snapshot.value?.status,
  (status) => {
    if (status === 'finished') {
      scheduleReadyRoomRedirect()
    }
  },
)

onBeforeUnmount(() => {
  if (settlementTimer !== null) {
    window.clearTimeout(settlementTimer)
    settlementTimer = null
  }
  stopPolling()
})
</script>

<style scoped>
.battle-page {
  display: grid;
  grid-template-rows: 150px 1fr 230px;
  gap: 24px;
  min-height: 100%;
  padding: 28px;
}

.settlement-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid #d7c483;
  border-radius: 10px;
  background: linear-gradient(90deg, #fff4cc 0%, #ffe7a3 100%);
  color: #5b4300;
}

.settlement-banner strong {
  font-size: 1rem;
}

.settlement-banner span {
  font-size: 0.92rem;
}

.battle-top,
.user-area {
  border: 1px solid #cfd1d8;
  border-radius: 8px;
  background: #f7f8fb;
}

.battle-top {
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.battle-tool {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #444;
  font-size: 14px;
  text-align: left;
}

.battle-tool input {
  width: 90px;
  height: 36px;
  border: 1px solid #cfd1d8;
  border-radius: 6px;
  padding: 0 8px;
  background: #fff;
  color: #222;
}

.opponent-list {
  display: flex;
  gap: 28px;
  overflow-x: auto;
  padding: 8px 4px 12px;
}

.player-card {
  flex: 0 0 320px;
  height: 108px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
  border: 1px solid #d5d6dc;
  border-radius: 8px;
  background: #f4f5f8;
}

.player-card.active,
.user-info.active {
  border-color: #8d79d6;
  box-shadow: 0 0 0 3px rgba(141, 121, 214, 0.18);
}

.player-avatar,
.user-avatar {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #dadada;
  color: #111;
  font-size: 34px;
}

.mini-back {
  width: 52px;
  height: 78px;
  padding: 5px;
  border-radius: 4px;
  background: #24466f;
}

.mini-back-inner {
  width: 100%;
  height: 100%;
  border: 2px double #e7efff;
  border-radius: 3px;
  background: repeating-linear-gradient(45deg, #2f5f9c 0 5px, #214571 5px 10px);
}

.card-count {
  color: #000;
  font-size: 34px;
  font-weight: 600;
}

.battle-table {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
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

.deck-card {
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%) rotate(18deg);
}

.game-card,
.deck-back {
  position: relative;
  width: 86px;
  height: 124px;
  border: 1px solid #555;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  background-position: center;
  background-size: cover;
}

.hand-card {
  border: 1px solid #777;
  cursor: pointer;
  transition: transform 0.2s;
}

.hand-card.selected {
  transform: translateY(-18px);
  border-color: #8d79d6;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
}

.hand-card:disabled {
  cursor: not-allowed;
}

.red-card {
  color: #df2b2b;
}

.black-card {
  color: #000;
}

.theme-soft {
  border-color: #7a72d8;
  background-color: #f5f4ff;
}

.red-card.theme-soft {
  color: #b95fe0;
}

.black-card.theme-soft {
  color: #1a155a
}

.theme-green {
  border-color: #58a879;
  background-color: #f0fff6;
}

.red-card.theme-green {
  color: #72f543;
}

.black-card.theme-green {
  color: #114b30
}

.card-corner {
  position: absolute;
  top: 5px;
  left: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.card-center {
  position: absolute;
  right: 8px;
  bottom: 7px;
  font-size: 54px;
  line-height: 1;
}

.deck-back {
  height: 92px;
  background-color: #264b7c;
  box-shadow: 12px 12px 0 #777, 20px 20px 0 #b8b8b8;
}

.back-pattern {
  position: absolute;
  inset: 8px;
  border: 3px double #e7efff;
  border-radius: 5px;
  background:
    radial-gradient(circle at 50% 50%, #ffffff 0 4px, transparent 5px),
    repeating-linear-gradient(45deg, #2f5f9c 0 6px, #214571 6px 12px);
}

.user-area {
  display: grid;
  grid-template-columns: 150px 160px 1fr;
  align-items: center;
  gap: 20px;
  padding: 24px 40px;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.action-panel button {
  width: 120px;
  height: 54px;
  border: 2px solid #222;
  border-radius: 8px;
  background: #f8f8f8;
  color: #111;
  font-size: 30px;
  cursor: pointer;
}

.action-panel button:hover:not(:disabled) {
  background: #ece6fa;
}

.action-panel button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 12px;
}

.turn-text {
  min-height: 20px;
  color: #555;
  font-size: 14px;
}

.hand-area {
  min-width: 0;
  overflow-x: auto;
  padding: 22px 8px 10px;
}

@media (max-width: 900px) {
  .battle-page {
    grid-template-rows: auto 1fr auto;
  }

  .settlement-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .battle-top,
  .user-area {
    grid-template-columns: 1fr;
  }

  .deck-card {
    right: 20px;
  }
}
</style>
