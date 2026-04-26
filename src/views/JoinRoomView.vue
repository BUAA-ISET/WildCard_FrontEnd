<template>
  <div class="join-room-wrapper">
    <div class="join-room-center">
      <h1 class="join-room-title">Join Room</h1>
      <div class="join-room-card">
        <div class="join-room-label">{{ showPassword ? '密码' : '房间号' }}</div>
        <el-input
            v-if="!showPassword"
            v-model="roomCode"
            placeholder="Enter room code...(123456)"
            class="join-room-input"
            @keyup.enter="onRoomCodeInput"
        />
        <el-input
            v-else
            v-model="roomPassword"
            placeholder="Enter room password...(abc123)"
            class="join-room-input"
            type="password"
            @keyup.enter="onJoin"
        />
        <el-button class="join-room-btn" size="medium" @click="showPassword ? onJoin() : onRoomCodeInput()">加入房间</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const roomCode = ref('')
const roomPassword = ref('')
const showPassword = ref(false)

const roomsWithPassword: Record<string, string> = {
  '123456': 'abc123',
}

function onRoomCodeInput() {
  if (!roomCode.value) {
    ElMessage.error('请输入房间号')
    return
  }
  if (roomsWithPassword[roomCode.value]) {
    showPassword.value = true
    roomPassword.value = ''
  } else {
    router.push('/battle')
  }
}

function onJoin() {
  if (!roomPassword.value) {
    ElMessage.error('该房间需要输入密码')
    return
  }
  if (roomPassword.value !== roomsWithPassword[roomCode.value]) {
    ElMessage.error('密码错误')
    return
  }
  router.push('/battle')
}
</script>

<style scoped>
.join-room-wrapper {
    min-height: 80vh;
    background: #f3f2fa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.join-room-center {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.join-room-title {
    font-size: 2.2rem;
    font-weight: 600;
    margin-bottom: 32px;
    color: #23223a;
}

.join-room-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    padding: 40px 48px 32px 48px;
    min-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.join-room-label {
    font-size: 1.3rem;
    font-weight: 500;
    margin-bottom: 16px;
    color: #23223a;
}

.join-room-input {
    width: 320px;
    margin-bottom: 18px;
}

.join-room-btn {
    font-size: 1rem;
    padding: 12px 24px;
    border-radius: 6px;
    background: #fff;
    color: #222;
    border: 1px solid #222;
    transition: background 0.2s, color 0.2s, border 0.2s;
    width: 100%;
    margin-top: 8px;
    cursor: pointer;
}

.join-room-btn:hover {
  background: #ece6fa;
}

</style>
