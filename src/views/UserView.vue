<template>
	<div class="user-page-wrapper">
		<div v-if="isLoggedIn" class="user-account-container">
			<el-button class="toggle-btn" @click="toggleLoginState" size="small" style="position: absolute; top: 16px; right: 16px;">切换登录状态</el-button>
			<div class="profile-block">
				<div class="profile-content">
					<img :src="user.avatar || defaultAvatar" class="avatar-img"/>
					<div class="user-email">{{ user.username }}</div>
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
			<el-button class="toggle-btn" @click="toggleLoginState" size="small" style="position: absolute; top: 16px; right: 16px;">切换登录状态</el-button>
			<el-tabs v-model="authTab">
				<el-tab-pane label="登录" name="login">
					<div class="auth-form">
						<div class="auth-field">
							<div class="setting-label">邮箱</div>
							<el-input v-model="loginForm.email" placeholder="example@mail.com" class="setting-input" />
						</div>
						<div class="auth-field">
							<div class="setting-label">密码</div>
							<el-input v-model="loginForm.password" type="password" class="setting-input" />
						</div>
						<el-button class="user-btn" size="medium" @click="onLogin">登录</el-button>
					</div>
				</el-tab-pane>
				<el-tab-pane label="注册" name="register">
					<div class="auth-form">
						<div class="auth-field">
							<div class="setting-label">邮箱</div>
							<el-input v-model="registerForm.email" placeholder="example@mail.com" class="setting-input" />
						</div>
						<div class="auth-field">
							<div class="setting-label">用户名</div>
							<el-input v-model="registerForm.username" class="setting-input" />
						</div>
						<div class="auth-field">
							<div class="setting-label">密码</div>
							<el-input v-model="registerForm.password" type="password" class="setting-input" />
						</div>
						<div class="auth-field">
							<div class="setting-label">确认密码</div>
							<el-input v-model="registerForm.confirm" type="password" class="setting-input" />
						</div>
						<el-button class="user-btn" size="medium" @click="onRegister">注册</el-button>
					</div>
				</el-tab-pane>
			</el-tabs>
		</div>
	</div>  
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi } from '../api/user'

const defaultAvatar = 'https://www.gravatar.com/avatar/?d=mp&s=120'

const isLoggedIn = ref(false)
const user = reactive({
	username: 'example',
	avatar: '',
})

const userForm = reactive({
	username: user.username,
})
const passwordForm = reactive({
	current: '',
	new: '',
	confirm: '',
})

const authTab = ref('login')
const loginForm = reactive({
	email: '',
	password: '',
})
const registerForm = reactive({
	email: '',
    username: '',
	password: '',
	confirm: '',
})

async function onLogin() {
	if (!loginForm.email || !loginForm.password) {
		ElMessage.error('请输入邮箱和密码')
		return
	}
	const result = await userApi.login({ email: loginForm.email, password: loginForm.password })
	if (result.success && result.data) {
		user.username = result.data.username
		user.avatar = result.data.avatar
		isLoggedIn.value = true
		ElMessage.success('登录成功')
	} else {
		ElMessage.error(result.message || '登录失败')
	}
}

async function onRegister() {
	if (!registerForm.email || !registerForm.username || !registerForm.password) {
		ElMessage.error('请填写所有字段')
		return
	}
	if (registerForm.password !== registerForm.confirm) {
		ElMessage.error('两次输入的密码不一致')
		return
	}
	const result = await userApi.register({ 
		email: registerForm.email, 
		password: registerForm.password,
		username: registerForm.username 
	})
	if (result.success && result.data) {
		user.username = result.data.username
		user.avatar = result.data.avatar
		isLoggedIn.value = true
		ElMessage.success('注册成功')
	} else {
		ElMessage.error(result.message || '注册失败')
	}
}

async function onLogout() {
	await userApi.logout()
	isLoggedIn.value = false
	loginForm.email = ''
	loginForm.password = ''
	ElMessage.success('已退出登录')
}

function toggleLoginState() {
	isLoggedIn.value = !isLoggedIn.value
	if (isLoggedIn.value) {
		user.username = 'test@mail.com'
	} else {
		user.username = ''
	}
}

async function onUpdateUsername() {
	if (!userForm.username) {
		ElMessage.error('用户名不能为空')
		return
	}
	const result = await userApi.updateUsername(userForm.username)
	if (result.success && result.data) {
		user.username = result.data.username
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
		newPassword: passwordForm.new 
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
	box-shadow: 0 4px 24px rgba(0,0,0,0.06);
	padding: 48px 64px;
	position: relative;
}

.profile-block {
	flex: 1;
	min-width: 280px;
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
}

.avatar-img {
	width: 120px;
	height: 120px;
	border-radius: 50%;
	background: #f0f0f0;
	margin-bottom: 16px;
}

.user-email {
	font-size: 1.1rem;
	color: #333;
	margin-bottom: 24px;
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

.toggle-btn {
	z-index: 10;
}

.auth-container {
	background: #fff;
	border-radius: 16px;
	box-shadow: 0 4px 24px rgba(0,0,0,0.06);
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

.user-btn:hover {
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
