<template>
  <aside class="json-panel">
    <div class="panel-header">
      <div>
        <h2>JSON 预览</h2>
        <p>前端会按文档格式生成可提交报文</p>
      </div>
      <el-button size="small" @click="$emit('copy-json')">复制</el-button>
    </div>
    <div class="validation-list">
      <div v-if="validations.length === 0" class="valid-item success">当前没有发现明显问题</div>
      <div
        v-for="item in validations"
        :key="item.message"
        class="valid-item"
        :class="item.level"
      >
        {{ item.message }}
      </div>
    </div>
    <pre class="json-code">{{ jsonText }}</pre>
  </aside>
</template>

<script setup lang="ts">
import type { ValidationResult } from '../../types/ruleBuilder'

defineProps<{
  jsonText: string
  validations: ValidationResult[]
}>()

defineEmits<{
  (event: 'copy-json'): void
}>()
</script>

<style scoped>
.json-panel {
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border-left: 1px solid #dde1ea;
  background: #fff;
  text-align: left;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  border-bottom: 1px solid #edf0f5;
}

.panel-header h2 {
  margin: 0 0 4px;
  color: #252633;
  font-size: 18px;
  font-weight: 700;
}

.panel-header p {
  margin: 0;
  color: #3a4050;
  font-size: 13px;
}

.validation-list {
  max-height: 140px;
  overflow-y: auto;
  padding: 12px 14px;
  border-bottom: 1px solid #edf0f5;
}

.valid-item {
  padding: 8px 10px;
  border-radius: 6px;
  color: #596170;
  font-size: 12px;
  line-height: 1.4;
}

.valid-item + .valid-item {
  margin-top: 6px;
}

.valid-item.success {
  background: #eef8f2;
  color: #287245;
}

.valid-item.warning {
  background: #fff6e7;
  color: #9a651f;
}

.valid-item.error {
  background: #fff0f0;
  color: #a53a3a;
}

.json-code {
  min-height: 0;
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: #1f2430;
  color: #e7edf7;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre;
}
</style>
