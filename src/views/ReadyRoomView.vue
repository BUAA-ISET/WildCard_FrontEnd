<template>
  <div class="ready-room-page">
    <section class="ready-room-shell" v-if="room">
      <div class="room-header-card">
        <div>
          <p class="room-eyebrow">Ready Room</p>
        </div>

        <div class="room-summary">
          <div class="summary-item">
            <span class="summary-label">房间号</span>
            <strong class="summary-value">{{ room.code }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">游戏规则</span>
            <strong class="summary-value">{{ room.ruleName }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">玩家人数</span>
            <strong class="summary-value">{{ room.players.length }}/{{ room.playerCount }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">回合时长</span>
            <strong class="summary-value">{{ room.roundTime }}s</strong>
          </div>
        </div>
      </div>

      <section class="players-grid">
        <article
          v-for="player in room.players"
          :key="player.id"
          class="player-box"
          :class="{ current: player.id === currentPlayerId, selected: selectedPlayerId === player.id }"
          role="button"
          tabindex="0"
          @click="toggleSelectedPlayer(player.id)"
          @keydown.enter.prevent="toggleSelectedPlayer(player.id)"
        >
          <img
            :src="resolveAvatarUrl(player.avatar)"
            :alt="player.username"
            class="player-avatar"
          />

          <div class="player-name">{{ player.username }}</div>
          <div class="player-status" :class="{ ready: player.isReady }">
            {{ player.id === room.hostId ? '房主' : player.isReady ? '准备' : '未准备' }}
          </div>
          <ReportButton
            v-if="player.id !== currentPlayerId && selectedPlayerId === player.id"
            class="player-report"
            target-type="user"
            :target-id="player.id"
            :target-label="player.username"
            tooltip="举报玩家"
            small
            :context="{ roomCode: room.code, targetLabel: player.username }"
          />
        </article>

        <article
          v-for="slot in emptySlots"
          :key="`empty-${slot}`"
          class="player-box empty"
        >
        </article>
      </section>

      <section class="actions-card">
        <button
          v-if="isHost"
          class="primary-btn"
          :disabled="!canStart || actionLoading"
          @click="startGame"
        >
          开始游戏
        </button>
        <button
          v-else
          class="secondary-btn"
          :disabled="actionLoading"
          @click="toggleReady"
        >
          {{ currentPlayer?.isReady ? '取消准备' : '准备' }}
        </button>
        <button class="danger-btn" :disabled="actionLoading" @click="leaveRoom">
          离开房间
        </button>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { roomApi, getRoomEntryPath, type Room } from '../api/room'
import { useUserStore } from '../stores/userStore'
import { resolveAvatarUrl } from '../utils/avatar'
import ReportButton from '../components/report/ReportButton.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { username, avatar } = storeToRefs(userStore)
const currentPlayerId = roomApi.getCurrentPlayerId()
const room = ref<Room | null>(null)
const actionLoading = ref(false)
const selectedPlayerId = ref('')
let pollingTimer: number | null = null
const currentPlayer = computed(() => room.value?.players.find((player) => player.id === currentPlayerId) || null)

const emptySlots = computed(() => {
  if (!room.value) {
    return 0
  }

  return Math.max(room.value.playerCount - room.value.players.length, 0)
})
const isHost = computed(() => room.value?.hostId === currentPlayerId)
const canStart = computed(() => {
  if (!room.value) {
    return false
  }

  return (
    isHost.value &&
    room.value.players.length === room.value.playerCount &&
    room.value.players.every((player) => player.isReady)
  )
})

function syncCurrentPlayerProfile() {
  if (!room.value || !currentPlayer.value) {
    return
  }

  currentPlayer.value.username = username.value || currentPlayer.value.username
  currentPlayer.value.avatar = avatar.value || currentPlayer.value.avatar
}

async function refreshRoom() {
  const roomCode = String(route.params.roomCode || '')
  if (!roomCode) {
    return
  }

  const result = await roomApi.getRoomByCode(roomCode)
  if (!result.success || !result.data) {
    stopPolling()
    ElMessage.error(result.message || '房间不存在')
    await router.replace('/')
    return
  }

  room.value = result.data
  syncCurrentPlayerProfile()
  if (selectedPlayerId.value && !room.value.players.some((player) => player.id === selectedPlayerId.value)) {
    selectedPlayerId.value = ''
  }

  if (!room.value.players.some((player) => player.id === currentPlayerId)) {
    stopPolling()
    ElMessage.error('你已不在当前房间中')
    await router.replace('/')
    return
  }

  const expectedPath = getRoomEntryPath(room.value)
  if (route.path !== expectedPath) {
    stopPolling()
    await router.replace(expectedPath)
    return
  }
}

async function toggleReady() {
  if (!currentPlayer.value || isHost.value) {
    return
  }

  actionLoading.value = true
  const result = await roomApi.setReady(!currentPlayer.value.isReady)
  actionLoading.value = false

  if (!result.success || !result.data) {
    ElMessage.error(result.message || '准备状态更新失败')
    return
  }

  room.value = result.data
  syncCurrentPlayerProfile()
}

async function startGame() {
  actionLoading.value = true
  const result = await roomApi.startGame()
  actionLoading.value = false

  if (!result.success || !result.data) {
    ElMessage.error(result.message || '无法开始游戏')
    return
  }

  room.value = result.data
  stopPolling()
  await router.push(getRoomEntryPath(result.data))
}

async function leaveRoom() {
  actionLoading.value = true
  const result = await roomApi.leaveRoom()
  actionLoading.value = false

  if (!result.success) {
    ElMessage.error('离开房间失败')
    return
  }

  stopPolling()
  await router.replace('/')
}

function stopPolling() {
  if (pollingTimer !== null) {
    window.clearInterval(pollingTimer)
    pollingTimer = null
  }
}

function toggleSelectedPlayer(playerId: string) {
  if (playerId === currentPlayerId) {
    selectedPlayerId.value = ''
    return
  }
  selectedPlayerId.value = selectedPlayerId.value === playerId ? '' : playerId
}

onMounted(async () => {
  await refreshRoom()
  pollingTimer = window.setInterval(() => {
    void refreshRoom()
  }, 1500)
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
.ready-room-page {
  min-height: 100%;
  padding: 24px;
  background: #f5f6fa;
}

.ready-room-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.room-header-card,
.room-state-card,
.actions-card {
  background: #fff;
  border: 1px solid #d7dbe7;
  border-radius: 20px;
}

.room-header-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px 32px;
}

.room-eyebrow {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #7a7f8f;
  margin-bottom: 10px;
}

.room-title {
  font-size: 2rem;
  color: #1f2430;
  margin-bottom: 10px;
}

.room-subtitle {
  max-width: 620px;
  color: #5e6472;
  line-height: 1.6;
}

.room-summary {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-item {
  min-height: 86px;
  padding: 14px 16px;
  border: 1px solid #d7dbe7;
  border-radius: 8px;
  background: #f5f6fa;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-label {
  display: block;
  color: #7a7f8f;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.summary-value {
  color: #1f2430;
  font-size: 1.15rem;
  overflow-wrap: anywhere;
}

.room-state-card {
  display: flex;
  gap: 24px;
  padding: 18px 24px;
}

.state-line {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #5e6472;
}

.state-line strong {
  color: #1f2430;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.player-box {
  position: relative;
  min-height: 180px;
  padding: 24px 18px;
  border: 1px solid #d7dbe7;
  border-radius: 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.player-report {
  position: absolute;
  top: 12px;
  right: 12px;
}

.player-box.current {
  border-color: #ab99af;
  box-shadow: 0 8px 20px rgba(171, 153, 175, 0.16);
}

.player-box.selected {
  border-color: #d46b6b;
  box-shadow: 0 8px 20px rgba(159, 47, 47, 0.12);
}

.player-box.empty {
  background: #fafbfe;
  border-style: dashed;
}

.player-avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  object-fit: cover;
  background: #dadada;
}

.fallback-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: #1f2430;
  background: #dedede;
}

.ghost-avatar {
  color: #8b92a5;
  background: #eceff6;
}

.player-name {
  margin-top: 16px;
  font-size: 1.08rem;
  font-weight: 700;
  color: #1f2430;
  word-break: break-word;
}

.player-status {
  margin-top: 12px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #eceff6;
  color: #737b8c;
  font-size: 0.92rem;
  font-weight: 600;
}

.player-status.ready {
  background: #e5f4ea;
  color: #2f7a46;
}

.actions-card {
  display: flex;
  gap: 16px;
  padding: 18px;
}

.actions-card button {
  min-height: 50px;
  padding: 0 24px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s, border-color 0.2s;
}

.actions-card button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions-card button:hover:not(:disabled) {
  background: #ece6fa;
}

.primary-btn {
  background: #ece6fa;
  border-color: #ab99af;
  color: #333;
}

.secondary-btn {
  background: #fff;
  border-color: #cfd5e3;
  color: #333;
}

.danger-btn {
  background: #fff;
  border-color: #d7dbe7;
  color: #8d3d3d;
}

@media (max-width: 900px) {
  .ready-room-page {
    padding: 16px;
  }

  .room-header-card,
  .room-state-card,
  .actions-card {
    flex-direction: column;
  }

  .room-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .actions-card button {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .room-summary {
    grid-template-columns: 1fr;
  }
}
</style>
