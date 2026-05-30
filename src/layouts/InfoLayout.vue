<template>
  <div class="main-layout">
    <header class="top-header">
      <div class="header-logo" role="button" tabindex="0" @click="goHome" @keydown.enter.prevent="goHome">WildCard</div>
      <div class="header-nav">
        <div class="top-nav-item" @click="handleTeamIntro">团队介绍</div>
        <div class="top-nav-item" @click="handleContact">联系我们</div>
        <div class="top-nav-item" @click="handleHelp">帮助中心</div>
      </div>
      <div class="header-actions">
        <button type="button" class="back-btn" @click="goHome">← 返回主页</button>
      </div>
    </header>
    <div class="main-body">
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

const goHome = () => {
  void router.push('/');
};

const handleTeamIntro = () => {
  void router.push('/teaminfo/about');
};

const handleContact = () => {
  void router.push('/teaminfo/contact');
};

const handleHelp = () => {
  void router.push('/teaminfo/help');
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
  cursor: pointer;
  outline: none;
}

.header-logo:hover {
  color: #4a3aa3;
}

.header-nav {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 24px;
  grid-column: 2;
}

.header-actions {
  grid-column: 3;
  display: flex;
  justify-content: flex-end;
}

.back-btn {
  border: 1px solid #d9def0;
  background: #fff;
  color: #4a3aa3;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.back-btn:hover {
  background: #ece6fa;
  border-color: #4a3aa3;
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
