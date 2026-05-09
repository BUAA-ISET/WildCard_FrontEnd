<template>
  <div class="home-wrapper">
    <div class="home-center">
      <img src="/src/assets/logo.svg" alt="Wild Card Logo" class="main-logo" />
      <div class="subtitle">Make your own rule!</div>
      <div class="desc">
        Unleash your imagination, design your own card game rules, and start playing!<br />
        You can also use our pre-set rules.
      </div>
      <div class="action-btns">
        <el-button
          v-if="resumeRoomPath"
          class="main-btn accent-btn"
          size="large"
          @click="resumeRoom"
        >
          CONTINUE ROOM
        </el-button>
        <el-button class="main-btn" size="large" @click="$router.push('/create-room')">CREATE ROOM</el-button>
        <el-button class="main-btn" size="large" @click="$router.push('/join-room')">JOIN ROOM</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { roomApi, getRoomEntryPath, type Room } from '../api/room'

const router = useRouter()
const currentRoom = ref<Room | null>(null)

const resumeRoomPath = computed(() => (
  currentRoom.value ? getRoomEntryPath(currentRoom.value) : ''
))

async function loadCurrentRoom() {
  const result = await roomApi.getCurrentRoom()
  currentRoom.value = result.success ? result.data || null : null
}

function resumeRoom() {
  if (!resumeRoomPath.value) {
    return
  }

  router.push(resumeRoomPath.value)
}

onMounted(() => {
  void loadCurrentRoom()
})
</script>

<style scoped>
.home-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.main-logo {
  width: 320px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.desc {
  color: #666;
  margin-bottom: 28px;
  text-align: center;
  font-size: 0.9rem;
  line-height: 1.7;
}

.action-btns {
  display: flex;
  gap: 22px;
  margin-bottom: 36px;
}

.main-btn {
  font-size: 1.1rem;
  padding: 14px 38px;
  border-radius: 12px;
  background: #fff;
  color: #222;
  border: 2px solid #222;
  font-weight: 600;
  transition: background 0.2s, color 0.2s, border 0.2s;
}

.main-btn:hover {
  background: #ece6fa;
}

.accent-btn {
  background: #ece6fa;
}
</style>
