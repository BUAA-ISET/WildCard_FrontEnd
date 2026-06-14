<template>
  <section class="report-detail">
    <el-empty v-if="!report" description="请选择一条举报" />
    <template v-else>
      <header class="detail-header">
        <div>
          <h2>{{ report.context?.targetLabel || report.targetId }}</h2>
          <p>{{ typeText[report.targetType] || report.targetType }} · {{ statusText }}</p>
        </div>
        <el-tag :type="report.status === 'pending' ? 'danger' : report.status === 'resolved' ? 'success' : 'info'">
          {{ statusText }}
        </el-tag>
      </header>

      <dl class="detail-grid">
        <div>
          <dt>举报人</dt>
          <dd class="reporter-cell">
            <img
              :src="resolveAvatarUrl(report.reporterAvatar)"
              :alt="report.reporterName || report.reporterId"
            >
            <span>{{ report.reporterName || report.reporterId }}</span>
          </dd>
        </div>
        <div>
          <dt>目标 ID</dt>
          <dd>{{ report.targetId }}</dd>
        </div>
        <div>
          <dt>提交时间</dt>
          <dd>{{ formatTime(report.createdAt) }}</dd>
        </div>
        <div>
          <dt>来源页面</dt>
          <dd>{{ report.context?.sourcePath || '-' }}</dd>
        </div>
      </dl>

      <section class="detail-section">
        <h3>举报理由</h3>
        <p>{{ report.reason }}</p>
      </section>

      <section class="detail-section">
        <h3>补充说明</h3>
        <p>{{ report.details || '无补充说明' }}</p>
      </section>

      <section v-if="report.actionLog?.length" class="detail-section">
        <h3>处理记录</h3>
        <ul class="action-log">
          <li v-for="log in report.actionLog" :key="log.id">
            <strong>{{ actionText[log.action] || log.action }}</strong>
            <span>{{ formatTime(log.createdAt) }}</span>
            <p>{{ log.note || '无备注' }}</p>
          </li>
        </ul>
      </section>

      <footer class="detail-actions">
        <el-button
          type="danger"
          :disabled="report.status !== 'pending' || !canBanUser"
          @click="$emit('action', 'ban_user')"
        >
          封禁用户
        </el-button>
        <el-button
          type="warning"
          :disabled="report.status !== 'pending' || !canBanRule"
          @click="$emit('action', 'ban_rule')"
        >
          封禁规则
        </el-button>
        <el-button
          :disabled="report.status !== 'pending'"
          @click="$emit('action', 'dismiss')"
        >
          驳回
        </el-button>
      </footer>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Report, ReportAction } from '../../api/report'
import { resolveAvatarUrl } from '../../utils/avatar'

const props = defineProps<{
  report: Report | null
}>()

defineEmits<{
  action: [action: ReportAction]
}>()

const typeText: Record<string, string> = {
  user: '用户举报',
  rule: '规则举报',
  review: '评价举报',
  player_behavior: '对局行为举报',
}

const actionText: Record<string, string> = {
  ban_user: '封禁用户',
  ban_rule: '封禁规则',
  dismiss: '驳回',
}

const statusText = computed(() => {
  if (!props.report) return ''
  return props.report.status === 'pending' ? '待处理' : props.report.status === 'resolved' ? '已处理' : '已驳回'
})

const canBanUser = computed(() => props.report?.targetType === 'user' || props.report?.targetType === 'player_behavior')
const canBanRule = computed(() => props.report?.targetType === 'rule' || props.report?.targetType === 'review')

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped>
.report-detail {
  min-height: 420px;
  padding: 22px 24px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-header h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.detail-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0 0;
}

.detail-grid div {
  padding: 10px 12px;
  border-radius: 6px;
  background: #f5f6fa;
}

.detail-grid dt {
  color: #6b7280;
  font-size: 12px;
}

.detail-grid dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}

.reporter-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reporter-cell img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.detail-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #eef0f6;
}

.detail-section h3 {
  margin: 0 0 8px;
  font-size: 15px;
}

.detail-section p {
  margin: 0;
  color: #3a4050;
  line-height: 1.65;
  white-space: pre-wrap;
}

.action-log {
  margin: 0;
  padding-left: 18px;
}

.action-log li + li {
  margin-top: 10px;
}

.action-log span {
  margin-left: 8px;
  color: #6b7280;
  font-size: 12px;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

@media (max-width: 760px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
