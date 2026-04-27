<template>
  <div class="create-room-wrapper">
    <div class="create-room-center">
      <h1 class="create-room-title">Create Room</h1>
      <div class="create-room-card">
        <div class="create-room-label">房间设置</div>
        
        <div class="form-item">
          <div class="form-label">玩家人数</div>
          <el-select v-model="playerCount" placeholder="Select" class="form-select">
            <el-option v-for="n in 8" :key="n" :label="n" :value="n" />
          </el-select>
        </div>
        
        <div class="form-item">
          <div class="form-label">出牌时间(秒)</div>
          <el-select v-model="roundTime" placeholder="Select" class="form-select">
            <el-option v-for="t in [10, 15, 20, 30, 45, 60]" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        
        <div class="form-item">
          <div class="form-label">房间密码(可选)</div>
          <el-input
            v-model="roomPassword"
            placeholder="Enter password or leave empty"
            class="form-input"
            type="password"
          />
        </div>
        
        <el-button class="create-room-btn" size="medium" @click="onCreateRoom">创建</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const playerCount = ref(4)
const roundTime = ref(30)
const roomPassword = ref('')

function onCreateRoom() {
  const roomSettings = {
    playerCount: playerCount.value,
    roundTime: roundTime.value,
    password: roomPassword.value || null,
  }
  console.log('Creating room with settings:', roomSettings)
  ElMessage.success('房间创建成功')
  router.push('/battle')
}
</script>

<style scoped>
.create-room-wrapper {
    min-height: 80vh;
    background: #f3f2fa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.create-room-center {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.create-room-title {
    font-size: 2.2rem;
    font-weight: 600;
    margin-bottom: 32px;
    color: #23223a;
}

.create-room-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    padding: 40px 48px 32px 48px;
    min-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.create-room-label {
    font-size: 1.3rem;
    font-weight: 500;
    margin-bottom: 24px;
    color: #23223a;
}

.form-item {
    margin-bottom: 20px;
    width: 100%;
    text-align: left;
}

.form-label {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 10px;
    color: #555;
}

.form-select {
    width: 100%;
}

.form-input {
    width: 100%;
}

.create-room-btn {
    font-size: 1rem;
    padding: 12px 24px;
    border-radius: 6px;
    background: #fff;
    color: #222;
    border: 1px solid #222;
    transition: background 0.2s, color 0.2s, border 0.2s;
    width: 100%;
    margin-top: 16px;
    cursor: pointer;
}

.create-room-btn:hover {
    background: #ece6fa;
}
</style>