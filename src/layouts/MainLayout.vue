<template>
  <div class="main-layout">
    <header class="top-header">
      <div class="header-logo">WildCard</div>
      <div class="header-nav">
        <div class="top-nav-item" @click="handleTeamIntro">团队介绍</div>
        <div class="top-nav-item" @click="handleContact">联系我们</div>
        <div class="top-nav-item" @click="handleHelp">帮助中心</div>
      </div>
    </header>
    <div class="main-body">
      <aside class="sidebar">
        <nav class="nav">
          <router-link to="/" class="nav-item" exact-active-class="active">
            <el-icon><House /></el-icon>
            <span> 首页 </span>
          </router-link>
          <router-link to="/creation-center" class="nav-item" exact-active-class="active">
            <el-icon><EditPen /></el-icon>
            <span> 创作中心 </span>
          </router-link>
          <router-link to="/user-info" class="nav-item" exact-active-class="active">
            <el-icon><User /></el-icon>
            <span> 用户中心 </span>
          </router-link>
          <router-link to="/rule-market" class="nav-item" exact-active-class="active">
            <el-icon><Shop /></el-icon>
            <span> 规则市场 </span>
          </router-link>
          <router-link to="/card-style" class="nav-item" exact-active-class="active">
            <el-icon><Brush /></el-icon>
            <span> 卡牌样式 </span>
          </router-link>
          <router-link to="/battle" class="nav-item" exact-active-class="active">
            <el-icon><VideoPlay /></el-icon>
            <span> 对局界面 </span>
          </router-link>
        </nav>
        <div class="sidebar-bottom">
          <div class="user-avatar">
            <span class="avatar-circle">U</span>
            <div>
              <div class="username">Username</div>
              <div class="user-desc">Default Account</div>
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
import { useRouter } from 'vue-router';

const router = useRouter();

const handleTeamIntro = () => {
  openRouteInNewWindow('/teaminfo/about');
};

const handleContact = () => {
  openRouteInNewWindow('/teaminfo/contact');
};

const handleHelp = () => {
  openRouteInNewWindow('/teaminfo/help');
};

const openRouteInNewWindow = (path: string) => {
  const routeUrl = router.resolve(path).href;
  window.open(routeUrl, '_blank', 'noopener,noreferrer');
};
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
  padding: 16px 24px;
  flex-shrink: 0;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #d4d4d4;
  padding: 10px 12px;
  text-align: left;
}

.avatar-circle {
  width: 42px;
  height: 42px;
  background: #999;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: bold;
  color: #fff;
}

.username {
  font-weight: bold;
  color: #333;
}

.user-desc {
  font-size: 0.8rem;
  color: #666;
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
