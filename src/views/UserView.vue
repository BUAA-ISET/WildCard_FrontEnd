<template>
  <div class="user-page-wrapper">
    <div v-if="isLoggedIn" class="user-account-container">
      <div class="profile-block">
        <div class="profile-content">
          <img :src="user.avatar || defaultAvatar" class="avatar-img" />
          <div class="profile-meta">
            <div class="user-name">{{ user.username }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
        </div>
      </div>
      <div class="settings-block">
        <div class="setting-section">
          <div class="setting-label">用户名</div>
          <el-input v-model="userForm.username" class="setting-input" />
          <el-button class="user-btn" size="medium" @click="onUpdateUsername">修改用户名</el-button>
        </div>
        <div class="setting-section">
          <div class="setting-label">当前密码</div>
          <el-input v-model="passwordForm.current" type="password" class="setting-input" />
          <div class="setting-label">新密码</div>
          <el-input v-model="passwordForm.new" type="password" class="setting-input" />
          <div class="setting-label">确认新密码</div>
          <el-input v-model="passwordForm.confirm" type="password" class="setting-input" />
          <el-button class="user-btn" size="medium" @click="onUpdatePassword">修改密码</el-button>
        </div>
        <div class="logout-section">
          <el-button type="danger" class="logout-btn" size="medium" @click="onLogout">退出登录</el-button>
        </div>
      </div>
    </div>
    <div v-else class="auth-container">
      <el-tabs v-model="authTab">
        <el-tab-pane label="登录" name="login">
          <div class="auth-form">
            <div class="auth-field">
              <div class="setting-label">邮箱</div>
              <el-input v-model="loginForm.email" placeholder="example@mail.com" class="setting-input" />
            </div>
            <div class="auth-field">
              <div class="setting-label">密码</div>
              <el-input v-model="loginForm.password" type="password" class="setting-input" show-password />
            </div>
            <el-button class="user-btn" size="medium" @click="onLogin">登录</el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <div class="auth-form">
            <div class="auth-field">
              <div class="setting-label">邮箱</div>
              <div class="inline-field">
                <el-input
                  v-model="registerForm.email"
                  placeholder="example@mail.com"
                  class="setting-input compact-input"
                />
                <el-button
                  class="send-code-btn"
                  :disabled="isSendingCode || verificationCountdown > 0"
                  @click="onSendVerificationCode"
                >
                  {{ sendCodeButtonText }}
                </el-button>
              </div>
            </div>
            <div class="auth-field">
              <div class="setting-label">验证码</div>
              <el-input v-model="registerForm.verificationCode" class="setting-input" />
            </div>
            <div class="auth-field">
              <div class="setting-label">用户名</div>
              <el-input v-model="registerForm.username" class="setting-input" />
            </div>
            <div class="auth-field">
              <div class="setting-label">密码</div>
              <el-input v-model="registerForm.password" type="password" class="setting-input" show-password />
            </div>
            <div class="auth-field">
              <div class="setting-label">确认密码</div>
              <el-input v-model="registerForm.confirm" type="password" class="setting-input" show-password />
            </div>
            <el-button class="user-btn" size="medium" @click="onRegister">注册</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { shouldUseUserMockApi } from '../api/config'
import { userApi } from '../api/user'
import { useUserStore } from '../stores/userStore'
import defaultAvatarUrl from '../assets/default-avatar.svg'


const defaultAvatar = defaultAvatarUrl;
const SEND_CODE_COOLDOWN = 60
const isMockApi = shouldUseUserMockApi()

const userStore = useUserStore()
const { isLoggedIn, username, email, avatar } = storeToRefs(userStore)

const user = computed(() => ({
  username: username.value,
  email: email.value,
  avatar: avatar.value,
}))

const userForm = reactive({
  username: '',
})
const passwordForm = reactive({
  current: '',
  new: '',
  confirm: '',
})

const authTab = ref('login')
const loginForm = reactive({
  email: isMockApi ? 'test@mail.com' : '',
  password: isMockApi ? 'password123' : '',
})
const registerForm = reactive({
  email: '',
  verificationCode: '',
  username: '',
  password: '',
  confirm: '',
})

const isSendingCode = ref(false)
const verificationCountdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const sendCodeButtonText = computed(() => {
  if (isSendingCode.value) {
    return '发送中...'
  }

  if (verificationCountdown.value > 0) {
    return `${verificationCountdown.value}s后重发`
  }

  return '发送验证码'
})

function startVerificationCountdown() {
  verificationCountdown.value = SEND_CODE_COOLDOWN

  if (countdownTimer) {
    clearInterval(countdownTimer)
  }

  countdownTimer = setInterval(() => {
    if (verificationCountdown.value <= 1) {
      verificationCountdown.value = 0

      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }

      return
    }

    verificationCountdown.value -= 1
  }, 1000)
}

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

watch(username, (value) => {
  if (!value) {
    userForm.username = ''
  }
})

async function onLogin() {
  const emailValue = loginForm.email.trim()
  const password = loginForm.password.trim()

  if (!emailValue || !password) {
    ElMessage.error('请输入邮箱和密码')
    return
  }

  const result = await userStore.login({ email: emailValue, password })
  if (result.success) {
    ElMessage.success('登录成功')
  } else {
    ElMessage.error(result.message || '登录失败')
  }
}

async function onSendVerificationCode() {
  const emailValue = registerForm.email.trim()

  if (!emailValue) {
    ElMessage.error('请先输入邮箱')
    return
  }

  isSendingCode.value = true
  const result = await userApi.sendVerificationCode({ email: emailValue })
  isSendingCode.value = false

  if (result.success) {
    startVerificationCountdown()

    if (result.debugCode) {
      registerForm.verificationCode = result.debugCode
      ElMessage.success(`验证码已发送，当前模拟验证码：${result.debugCode}`)
    } else {
      ElMessage.success(result.message || '验证码已发送')
    }
  } else {
    ElMessage.error(result.message || '验证码发送失败')
  }
}

async function onRegister() {
  if (
    !registerForm.email.trim() ||
    !registerForm.verificationCode.trim() ||
    !registerForm.username.trim() ||
    !registerForm.password
  ) {
    ElMessage.error('请填写所有字段')
    return
  }

  if (registerForm.password !== registerForm.confirm) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  const result = await userStore.register({
    email: registerForm.email.trim(),
    verificationCode: registerForm.verificationCode.trim(),
    password: registerForm.password,
    username: registerForm.username.trim(),
  })

  if (result.success) {
    registerForm.email = ''
    registerForm.verificationCode = ''
    registerForm.username = ''
    registerForm.password = ''
    registerForm.confirm = ''
    verificationCountdown.value = 0

    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }

    ElMessage.success('注册成功')
  } else {
    ElMessage.error(result.message || '注册失败')
  }
}

async function onLogout() {
  await userStore.logout()
  userForm.username = ''
  loginForm.email = isMockApi ? 'test@mail.com' : ''
  loginForm.password = isMockApi ? 'password123' : ''
  ElMessage.success('已退出登录')
}

async function onUpdateUsername() {
  const usernameValue = userForm.username.trim()

  if (!usernameValue) {
    ElMessage.error('用户名不能为空')
    return
  }

  const result = await userApi.updateUsername(usernameValue)
  if (result.success && result.data) {
    userStore.setUser(result.data)
    ElMessage.success('用户名已更新')
  } else {
    ElMessage.error(result.message || '更新失败')
  }
}

async function onUpdatePassword() {
  if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
    ElMessage.error('请填写所有密码字段')
    return
  }

  if (passwordForm.new !== passwordForm.confirm) {
    ElMessage.error('新密码两次输入不一致')
    return
  }

  const result = await userApi.updatePassword({
    currentPassword: passwordForm.current,
    newPassword: passwordForm.new,
  })

  if (result.success) {
    passwordForm.current = ''
    passwordForm.new = ''
    passwordForm.confirm = ''
    ElMessage.success(result.message || '密码已更新')
  } else {
    ElMessage.error(result.message || '更新失败')
  }
}
</script>

<style scoped>
.user-page-wrapper {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fc;
}

.user-account-container {
  display: flex;
  gap: 48px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  padding: 48px 64px;
  position: relative;
}

.profile-block {
  flex: 1;
  min-width: 320px;
  padding: 24px 32px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
}

.profile-meta {
  width: 100%;
  max-width: 280px;
}

.avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f0f0f0;
  margin-bottom: 18px;
}

.user-name {
  font-size: 1.22rem;
  color: #1f1f1f;
  margin-bottom: 6px;
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
  word-break: break-word;
}

.user-email {
  font-size: 0.95rem;
  color: #666;
  text-align: center;
  line-height: 1.4;
  word-break: break-all;
}

.settings-block {
  flex: 1.5;
  min-width: 340px;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
}

.setting-section {
  margin-bottom: 24px;
}

.setting-label {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 8px;
  margin-top: 12px;
  font-weight: 500;
  text-align: left;
}

.setting-label:first-child {
  margin-top: 0;
}

.setting-input {
  margin-bottom: 8px;
  width: 100%;
}

.inline-field {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.compact-input {
  margin-bottom: 0;
  flex: 1;
}

.send-code-btn {
  width: fit-content;
  min-width: 0;
  height: var(--el-component-size, 40px);
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #222;
  background: #fff;
  color: #222;
  flex: 0 0 auto;
  white-space: nowrap;
}

.logout-section {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.logout-btn {
  font-size: 1.1rem;
  padding: 14px 38px;
  border-radius: 6px;
  background: #fff;
  color: #ff0000;
  border: 1px solid #ff0000;
  transition: background 0.2s, color 0.2s, border 0.2s;
}

.logout-btn:hover {
  background: #ffe2e2;
}

.auth-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  padding: 48px 64px;
  min-width: 400px;
  position: relative;
}

.auth-form {
  margin-top: 16px;
}

.auth-field {
  margin-bottom: 16px;
}

.user-btn {
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

.user-btn:hover,
.send-code-btn:hover {
  background: #ece6fa;
}

:deep(.el-tabs__header) {
  margin-bottom: 8px;
}

:deep(.el-tabs__item) {
  font-size: 1rem;
  font-weight: 500;
}
</style>
