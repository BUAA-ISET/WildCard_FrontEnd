<template>
  <div :class="['main-layout', { 'auth-only-layout': !isLoggedIn, 'preview-shell': isPreviewIframe }]" data-testid="app-shell">
    <header v-if="isLoggedIn && !isPreviewIframe" class="top-header">
      <div class="header-logo">WildCard</div>
      <div class="header-nav">
        <div class="top-nav-item" @click="handleTeamIntro">团队介绍</div>
        <div class="top-nav-item" @click="handleContact">联系我们</div>
        <div class="top-nav-item" @click="handleHelp">帮助中心</div>
      </div>
    </header>
    <div class="main-body">
      <aside v-if="isLoggedIn && !isPreviewIframe" class="sidebar">
        <nav class="nav">
          <router-link to="/" class="nav-item" exact-active-class="active">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </router-link>
          <router-link to="/creation-center" class="nav-item" exact-active-class="active">
            <el-icon><EditPen /></el-icon>
            <span>创作中心</span>
          </router-link>
          <router-link to="/rule-market" class="nav-item" exact-active-class="active">
            <el-icon><Shop /></el-icon>
            <span>规则市场</span>
          </router-link>
          <router-link to="/user-info" class="nav-item" exact-active-class="active">
            <el-icon><User /></el-icon>
            <span>用户中心</span>
          </router-link>
          <router-link
            v-if="userStore.isAdmin"
            to="/admin/rules-review"
            class="nav-item"
            exact-active-class="active"
          >
            <el-icon><Document /></el-icon>
            <span>规则审核</span>
          </router-link>
        </nav>
        <div class="sidebar-bottom">
          <div class="user-avatar">
            <img :src="displayAvatar" :alt="displayUsername" class="avatar-circle" />
            <div class="user-meta">
              <div class="username">{{ displayUsername }}</div>
              <div class="user-email">{{ displayEmail }}</div>
            </div>
          </div>
        </div>
      </aside>
      <main class="main-content">
        <div class="content-area">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { resolveAvatarUrl } from '../utils/avatar'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { isLoggedIn, username, email, avatar } = storeToRefs(userStore)

// 审核员预览路由（嵌在 dialog 同源 iframe 里）应该藏掉外层应用 chrome，
// 让 RuleBuilder 占满 iframe 全部高度；否则顶栏 + 侧栏会挤压画布。
const isPreviewIframe = computed(() =>
  Boolean(route?.path?.startsWith('/admin/rules-review/preview/')),
)

const displayAvatar = computed(() => resolveAvatarUrl(avatar.value))
const displayUsername = computed(() => username.value || '未登录')
const displayEmail = computed(() => email.value || 'not logged in')

const handleTeamIntro = () => {
  void router.push('/teaminfo/about')
}

const handleContact = () => {
  void router.push('/teaminfo/contact')
}

const handleHelp = () => {
  void router.push('/teaminfo/help')
}
</script>

<style scoped>
.main-layout,
.main-layout * {
  box-sizing: border-box;
}

.main-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: #e8e8e8;
  overflow: hidden;
}

.auth-only-layout {
  background: #fff;
}

.auth-only-layout .main-body,
.auth-only-layout .main-content,
.auth-only-layout .content-area {
  width: 100%;
  background: #fff;
}

.top-header {
  width: 100%;
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #f5f6fa;
  display: grid;
  grid-template-columns: 1fr 70% 1fr;
  align-items: center;
  padding: 0 32px;
  flex-shrink: 0;
  z-index: 10;
}

.header-logo {
  font-size: 1.4rem;
  font-weight: bold;
  color: #444;
  grid-column: 1;
  text-align: left;
}

.header-nav {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 24px;
  grid-column: 2;
}

.top-nav-item {
  text-align: center;
  font-size: 1.05rem;
  border-radius: 8px;
  padding: 8px 16px;
}

.top-nav-item:hover {
  background: #ece6fa;
  color: #333;
  cursor: pointer;
}

.main-body {
  display: flex;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  border-right: #ab99af solid 2px;
}

.nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: #555;
  text-decoration: none;
  font-size: 1.05rem;
  margin: 4px 12px;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
  gap: 12px;
}

.nav-item.active,
.nav-item:hover {
  background: #ece6fa;
  color: #333;
}

.sidebar-bottom {
  padding: 16px 20px 20px;
  flex-shrink: 0;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #cfcfcf;
  padding: 12px 14px;
  text-align: left;
  width: 100%;
  min-width: 0;
}

.user-meta {
  min-width: 0;
  flex: 1;
}

.avatar-circle {
  width: 42px;
  height: 42px;
  background: #999;
  border-radius: 50%;
  display: block;
  object-fit: cover;
}

.username {
  font-size: 0.98rem;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.3;
  margin-bottom: 4px;
  word-break: break-word;
}

.user-email {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.35;
  word-break: break-all;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f6fa;
  min-width: 0;
  overflow: hidden;
}

.content-area {
  flex: 1;
  overflow: auto;
  box-sizing: border-box;
  background: transparent;
}
</style>
