<template>
  <article
    :class="['report-list-item', { active }]"
    role="button"
    tabindex="0"
    @click="$emit('select')"
    @keydown.enter.prevent="$emit('select')"
  >
    <div class="item-main">
      <div class="item-title">
        <el-tag size="small" :type="tagType">{{ targetTypeText }}</el-tag>
        <strong>{{ report.context?.targetLabel || report.targetId }}</strong>
      </div>
      <p>{{ report.reason }}</p>
      <span class="item-evidence">{{ evidenceText }}</span>
    </div>
    <div class="item-side">
      <el-tag size="small" :type="statusTagType">{{ statusText }}</el-tag>
      <span>{{ formatTime(report.createdAt) }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Report } from '../../api/report'

const props = defineProps<{
  report: Report
  active?: boolean
}>()

defineEmits<{
  select: []
}>()

const typeText: Record<string, string> = {
  user: '用户',
  rule: '规则',
  review: '评价',
  player_behavior: '对局行为',
}

const targetTypeText = computed(() => typeText[props.report.targetType] || props.report.targetType)
const tagType = computed(() => props.report.targetType === 'player_behavior' ? 'warning' : 'info')
const statusText = computed(() => props.report.status === 'pending' ? '待处理' : props.report.status === 'resolved' ? '已处理' : '已驳回')
const statusTagType = computed(() => props.report.status === 'pending' ? 'danger' : props.report.status === 'resolved' ? 'success' : 'info')
const evidenceText = computed(() => {
  return props.report.details || '无补充说明'
})

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.report-list-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.report-list-item:hover,
.report-list-item.active {
  border-color: #6f7cff;
  box-shadow: 0 6px 18px rgba(42, 55, 120, 0.08);
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.item-title strong {
  overflow-wrap: anywhere;
}

.item-main p {
  margin: 8px 0 4px;
  color: #2d3142;
}

.item-evidence,
.item-side {
  color: #6b7280;
  font-size: 12px;
}

.item-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  white-space: nowrap;
}
</style>
