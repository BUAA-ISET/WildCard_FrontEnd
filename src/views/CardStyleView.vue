<template>
  <div class="card-style-page">
    <section class="setting-panel">
      <h2>卡牌样式设置</h2>
      <div class="setting-row">
        <label>字符字体</label>
        <select v-model="cardStyle.fontFamily" @change="saveCardStyle">
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="'Courier New', monospace">Courier New</option>
          <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
        </select>
      </div>
      <div class="setting-row">
        <label>颜色风格</label>
        <select v-model="cardStyle.theme" @change="saveCardStyle">
          <option value="classic">经典黑红</option>
          <option value="soft">柔和蓝紫</option>
          <option value="green">薄荷绿</option>
        </select>
      </div>
      <div class="setting-row">
        <label>正面图片 URL</label>
        <input
          v-model="cardStyle.frontImage"
          type="text"
          placeholder="留空则使用默认白色牌面"
          @input="saveCardStyle"
        >
      </div>
      <div class="setting-row">
        <label>背面图片 URL</label>
        <input
          v-model="cardStyle.backImage"
          type="text"
          placeholder="留空则使用默认卡通牌背"
          @input="saveCardStyle"
        >
      </div>
      <button class="plain-btn" @click="resetCardStyle">恢复默认</button>
    </section>

    <section class="preview-panel">
      <h2>实时预览</h2>
      <div class="preview-cards">
        <div class="game-card front-card" :class="themeClass" :style="frontCardStyle">
          <div class="card-corner">
            <span>A</span>
            <span>♠</span>
          </div>
          <div class="card-center">♠</div>
        </div>
        <div class="game-card back-card" :style="backCardStyle">
          <div v-if="!cardStyle.backImage" class="back-pattern">
            <span>Wild</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'

type CardStyle = {
  fontFamily: string
  theme: string
  frontImage: string
  backImage: string
}

const storageKey = 'wildcard-card-style'

const defaultCardStyle: CardStyle = {
  fontFamily: 'Arial, sans-serif',
  theme: 'classic',
  frontImage: '',
  backImage: ''
}

const getSavedCardStyle = () => {
  const savedStyle = localStorage.getItem(storageKey)

  if (!savedStyle) {
    return defaultCardStyle
  }

  try {
    return {
      ...defaultCardStyle,
      ...JSON.parse(savedStyle)
    }
  } catch {
    return defaultCardStyle
  }
}

const cardStyle = reactive<CardStyle>(getSavedCardStyle())

const themeClass = computed(() => `theme-${cardStyle.theme}`)

const frontCardStyle = computed(() => ({
  fontFamily: cardStyle.fontFamily,
  backgroundImage: cardStyle.frontImage ? `url(${cardStyle.frontImage}) ` : 'none',
  BackgroundSize: cardStyle.frontImage ? 'cover' : 'initial'
}))

const backCardStyle = computed(() => ({
  backgroundImage: cardStyle.backImage ? `url(${cardStyle.backImage})` : 'none',
  backgroundSize: cardStyle.backImage ? 'cover' : 'initial'
}))

const saveCardStyle = () => {
  localStorage.setItem(storageKey, JSON.stringify(cardStyle))
}

const resetCardStyle = () => {
  Object.assign(cardStyle, defaultCardStyle)
  saveCardStyle()
}
</script>

<style scoped>
.card-style-page {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 28px;
  min-height: 100%;
  padding: 28px;
  text-align: left;
}

.setting-panel,
.preview-panel {
  background: #fff;
  border: 1px solid #dcdde2;
  border-radius: 8px;
  padding: 24px;
}

.setting-panel h2,
.preview-panel h2 {
  margin: 0 0 24px;
  color: #333;
  font-size: 24px;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.setting-row label {
  color: #444;
  font-size: 15px;
  font-weight: 600;
}

.setting-row input,
.setting-row select {
  width: 100%;
  height: 38px;
  border: 1px solid #cfd1d8;
  border-radius: 6px;
  padding: 0 10px;
  background: #fff;
  color: #333;
  font-size: 14px;
}

.plain-btn {
  height: 40px;
  padding: 0 18px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #fff;
  color: #222;
  font-size: 15px;
  cursor: pointer;
}

.plain-btn:hover {
  background: #ece6fa;
}

.preview-panel {
  display: flex;
  flex-direction: column;
}

.preview-cards {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  min-height: 360px;
}

.game-card {
  position: relative;
  width: 150px;
  height: 210px;
  border: 2px solid #333;
  border-radius: 10px;
  overflow: hidden;
  background-color: #fff;
  background-position: center;
  background-size: cover;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.front-card {
  color: #111;
}

.front-card.theme-soft {
  border-color: #7a72d8;
  color: #5b54b4;
  background-color: #f5f4ff;
}

.front-card.theme-green {
  border-color: #58a879;
  color: #21704b;
  background-color: #f0fff6;
}

.card-corner {
  position: absolute;
  top: 10px;
  left: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.card-center {
  position: absolute;
  right: 16px;
  bottom: 12px;
  color: #222;
  font-size: 82px;
  line-height: 1;
}

.theme-soft .card-center {
  color: #7a72d8;
}

.theme-green .card-center {
  color: #58a879;
}

.back-card {
  background-color: #264b7c;
}

.back-pattern {
  position: absolute;
  inset: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px double #e7efff;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 50%, #ffffff 0 5px, transparent 6px),
    repeating-linear-gradient(45deg, #2f5f9c 0 8px, #214571 8px 16px);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
}
</style>
