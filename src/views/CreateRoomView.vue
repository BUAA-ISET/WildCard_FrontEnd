<template>
  <div class="create-room-wrapper">
    <div class="create-room-center">
      <h1 class="create-room-title">创建房间</h1>
      <div class="create-room-card">
        <div class="create-room-label">房间设置</div>

        <div class="form-item">
          <div class="form-label">游戏规则</div>
          <el-select
            v-model="selectedRuleId"
            placeholder="选择游戏规则"
            class="form-select"
            :loading="rulesLoading"
          >
            <el-option
              v-for="rule in ruleOptions"
              :key="rule.id"
              :label="`${rule.name}（${rule.playerCount}人）`"
              :value="rule.id"
            />
          </el-select>
        </div>

        <div class="form-item">
          <div class="form-label">回合时间（秒）</div>
          <el-select v-model="roundTime" placeholder="请选择" class="form-select">
            <el-option v-for="t in [10, 15, 20, 30, 45, 60]" :key="t" :label="t" :value="t" />
          </el-select>
        </div>

        <div class="form-item">
          <div class="form-label">房间密码（可选）</div>
          <el-input
            v-model="roomPassword"
            placeholder="输入密码，留空则无密码"
            class="form-input"
            type="password"
          />
        </div>

        <el-button class="create-room-btn" size="medium" @click="onCreateRoom">创建房间</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { roomApi, getRoomEntryPath } from '../api/room'
import type { GameRuleOption } from '../api/room'

const route = useRoute()
const router = useRouter()
const roundTime = ref(30)
const roomPassword = ref('')
const ruleOptions = ref<GameRuleOption[]>([])
const selectedRuleId = ref('')
const rulesLoading = ref(false)

onMounted(async () => {
  rulesLoading.value = true
  const result = await roomApi.getRuleOptions()
  rulesLoading.value = false

  if (result.success && result.data && result.data.length > 0) {
    ruleOptions.value = result.data
    applyRouteRuleSelection(result.data)
    return
  }

  ElMessage.error(result.message || '游戏规则加载失败')
})

function applyRouteRuleSelection(options: GameRuleOption[]) {
  const routeRuleId = typeof route.query.ruleId === 'string' ? route.query.ruleId : ''
  const routeRuleName = typeof route.query.ruleName === 'string' ? route.query.ruleName : '市场规则'

  if (!routeRuleId) {
    selectedRuleId.value = options[0]?.id || ''
    return
  }

  if (!options.some((rule) => rule.id === routeRuleId)) {
    ruleOptions.value = [
      {
        id: routeRuleId,
        name: routeRuleName,
        playerCount: 2,
        description: '从规则市场快速使用的规则',
      },
      ...options,
    ]
  }

  selectedRuleId.value = routeRuleId
}

async function onCreateRoom() {
  if (!selectedRuleId.value) {
    ElMessage.error('请选择游戏规则')
    return
  }

  const result = await roomApi.createRoom({
    ruleId: selectedRuleId.value,
    roundTime: roundTime.value,
    password: roomPassword.value || undefined,
  })

  if (result.success && result.data) {
    ElMessage.success(`房间创建成功，房间号：${result.data.code}`)
    router.push(getRoomEntryPath(result.data))
  } else {
    ElMessage.error(result.message || '创建房间失败')
  }
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
