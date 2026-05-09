<template>
  <div class="battle-page">
    <div class="battle-top">
      <div class="battle-tool">
        <label>玩家人数</label>
        <input v-model.number="playerCount" type="number" min="2" max="8">
      </div>
      <div class="opponent-list">
        <div
          v-for="player in opponents"
          :key="player.id"
          class="player-card"
          :class="{ active: currentPlayerId === player.id }"
        >
          <div class="player-avatar">{{ player.name }}</div>
          <div class="mini-back" :style="backCardStyle">
            <div v-if="!cardStyle.backImage" class="mini-back-inner"></div>
          </div>
          <!-- <div class="back-card" :style="backCardStyle">
            <div v-if="!cardStyle.backImage" class="op-back-pattern"></div>
          </div> -->
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
        <button @click="playSelectedCards">PLAY</button>
        <button @click="skipTurn">SKIP</button>
      </div>

      <div class="user-info" :class="{ active: currentPlayerId === 'me' }">
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { roomApi, DEFAULT_AVATAR, getRoomEntryPath, type Room } from '../api/room'
import { validateCardPlay, type PlayCard, type RoomRuleDefinition, type RoundPlayRecord } from '../utils/cardPlayRules'

type CardStyle = {
  fontFamily: string
  theme: string
  frontImage: string
  backImage: string
}

type CardItem = PlayCard & {
  suit: string
}

type RulePropertyConfig = {
  config?: Array<{
    display: string
    value: number
  }>
}

type RuleCardClass = {
  default_properties?: Record<string, RulePropertyConfig>
  user_properties?: Record<string, RulePropertyConfig>
}

const route = useRoute()
const router = useRouter()
const storageKey = 'wildcard-card-style'

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
const playRule = ref<RoomRuleDefinition | null>(null)
const currentRoom = ref<Room | null>(null)
const previousRoundPlay = ref<RoundPlayRecord | null>(null)
const playerCount = ref(3)
const currentPlayerId = ref(roomApi.getCurrentPlayerId())
const lastAction = ref('等待出牌')
const selectedCardIds = ref<string[]>([])
const tableCards = ref<CardItem[]>([
  { id: 'table-1', rank: '8', suit: '♠' },
  { id: 'table-2', rank: '8', suit: '♥' },
  { id: 'table-3', rank: '8', suit: '♣' },
  { id: 'table-4', rank: '3', suit: '♥' }
])
const handCards = ref<CardItem[]>([
  { id: 'hand-1', rank: '2', suit: '♣' },
  { id: 'hand-2', rank: 'K', suit: '♥' },
  { id: 'hand-3', rank: 'Q', suit: '♦' },
  { id: 'hand-4', rank: '10', suit: '♥' },
  { id: 'hand-5', rank: '2', suit: '♥' },
  { id: 'hand-6', rank: 'A', suit: '♦' },
  { id: 'hand-7', rank: 'K', suit: '♠' },
  { id: 'hand-8', rank: 'Q', suit: '♥' },
  { id: 'hand-9', rank: 'J', suit: '♠' },
  { id: 'hand-10', rank: '10', suit: '♥' },
  { id: 'hand-11', rank: '9', suit: '♠' },
  { id: 'hand-12', rank: '6', suit: '♣' },
  { id: 'hand-13', rank: '5', suit: '♥' },
  { id: 'hand-14', rank: '4', suit: '♥' }
])

const findPointPropertyConfig = () => {
  const cardClass = playRule.value?.classes?.card as RuleCardClass | undefined
  const properties = {
    ...(cardClass?.default_properties || {}),
    ...(cardClass?.user_properties || {}),
  }

  return properties.point || properties.rank || properties['点数']
}

const findPointByRank = (rank: string) => {
  const config = findPointPropertyConfig()?.config || []
  const matchedOption = config.find((option) => option.display === rank || String(option.value) === rank)

  if (typeof matchedOption?.value === 'number') {
    return matchedOption.value
  }

  const numericRank = Number(rank)
  return Number.isFinite(numericRank) ? numericRank : undefined
}

const readExistingPoint = (card: CardItem) => {
  const point = card.point ?? card.properties?.point ?? card.properties?.rank ?? card.properties?.['点数']
  return typeof point === 'number' ? point : undefined
}

const toPlayableCard = (card: CardItem): PlayCard => {
  const point = readExistingPoint(card) ?? findPointByRank(card.rank) ?? 0

  return {
    ...card,
    point,
    properties: {
      ...card.properties,
      rank: point ?? card.rank,
      point: point ?? card.properties?.point ?? card.rank,
      suit: card.properties?.suit ?? card.suit,
    },
  }
}

const opponents = computed(() => {
  if (currentRoom.value) {
    return currentRoom.value.players
      .filter((player) => player.id !== currentPlayerId.value)
      .map((player) => ({
        id: player.id,
        name: player.username || 'Player',
        avatar: player.avatar || DEFAULT_AVATAR,
        cardCount: 13
      }))
  }

  const count = Math.max(2, Math.min(8, Number(playerCount.value) || 3))

  return Array.from({ length: count - 1 }, (_, index) => ({
    id: `player-${index + 1}`,
    name: String.fromCharCode(65 + index),
    avatar: DEFAULT_AVATAR,
    cardCount: 17 - index * 2
  }))
})

const turnText = computed(() => {
  if (currentPlayerId.value === roomApi.getCurrentPlayerId()) {
    return `当前轮到你，${lastAction.value}`
  }

  const player = opponents.value.find(item => item.id === currentPlayerId.value)
  return `当前轮到玩家 ${player?.name || 'A'}`
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

const toggleCard = (cardId: string) => {
  if (selectedCardIds.value.includes(cardId)) {
    selectedCardIds.value = selectedCardIds.value.filter(id => id !== cardId)
    return
  }

  selectedCardIds.value.push(cardId)
}

const playSelectedCards = () => {
  if (selectedCardIds.value.length === 0) {
    lastAction.value = '请先选择手牌'
    return
  }

  const playableHandCards = handCards.value.map(toPlayableCard)
  const selectedIdSet = new Set(selectedCardIds.value)
  const selectedCards = playableHandCards.filter(card => selectedIdSet.has(card.id))
  const validationResult = validateCardPlay({
    selectedCards,
    handCards: playableHandCards,
    rule: playRule.value,
    previousRoundPlay: previousRoundPlay.value,
  })

  if (!validationResult.legal) {
    lastAction.value = validationResult.message
    return
  }

  tableCards.value = handCards.value.filter(card => selectedIdSet.has(card.id))
  previousRoundPlay.value = validationResult.roundPlay || null
  handCards.value = handCards.value.filter(card => !selectedCardIds.value.includes(card.id))
  selectedCardIds.value = []
  lastAction.value = '已出牌'
  currentPlayerId.value = opponents.value[0]?.id || roomApi.getCurrentPlayerId()
}

const skipTurn = () => {
  selectedCardIds.value = []
  lastAction.value = '已跳过'
  currentPlayerId.value = opponents.value[0]?.id || roomApi.getCurrentPlayerId()
}

async function loadPlayableRule() {
  const roomCode = String(route.params.roomCode || '')
  const roomResult = roomCode
    ? await roomApi.getRoomByCode(roomCode)
    : await roomApi.getCurrentRoom()

  if (!roomResult.success || !roomResult.data) {
    ElMessage.error(roomResult.message || 'Room does not exist.')
    await router.replace('/')
    return
  }

  currentRoom.value = roomResult.data
  playerCount.value = roomResult.data.playerCount

  const expectedPath = getRoomEntryPath(roomResult.data)
  if (route.path !== expectedPath) {
    await router.replace(expectedPath)
    return
  }

  const ruleResult = await roomApi.getRoomRule(roomResult.data?.id || roomResult.data?.code)

  if (ruleResult.success && ruleResult.data?.rule) {
    playRule.value = ruleResult.data.rule
    return
  }

  lastAction.value = ruleResult.message || '规则加载失败，暂时无法出牌'
}

onMounted(() => {
  void loadPlayableRule()
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

.back-card {
  width: 52px;
  height: 78px;
  background-color: #264b7c;
}

.op-back-pattern {
  position: absolute;
  inset: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px double #e7efff;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 50%, #ffffff 0 5px, transparent 6px),
    repeating-linear-gradient(45deg, #2f5f9c 0 8px, #214571 8px 16px);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
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

.action-panel button:hover {
  background: #ece6fa;
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

  .battle-top,
  .user-area {
    grid-template-columns: 1fr;
  }

  .deck-card {
    right: 20px;
  }
}
</style>
