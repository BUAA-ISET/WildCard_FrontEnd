<template>
  <section class="report-detail">
    <el-empty v-if="!report" description="请选择一条举报" />
    <template v-else>
      <header class="detail-header">
        <div>
          <h2>{{ report.context?.targetLabel || report.targetId }}</h2>
          <p>{{ typeText[report.targetType] || report.targetType }}</p>
        </div>
        <el-tag :type="report.status === 'pending' ? 'danger' : report.status === 'resolved' ? 'success' : 'info'">
          {{ statusText }}
        </el-tag>
      </header>

      <dl class="detail-grid">
        <div>
          <dt>举报 ID</dt>
          <dd>{{ report.id }}</dd>
        </div>
        <div>
          <dt>举报人</dt>
          <dd class="reporter-cell">
            <img
              :src="resolveAvatarUrl(getReportReporter(report).avatar)"
              :alt="getReportReporter(report).name || getReportReporter(report).id"
            >
            <span>{{ getReportReporter(report).name || getReportReporter(report).id }}</span>
          </dd>
        </div>
        <div v-if="report.targetUser">
          <dt>被举报用户</dt>
          <dd class="user-cell">
            <img
              :src="resolveAvatarUrl(report.targetUser.avatar)"
              :alt="report.targetUser.name || report.targetUser.id"
            >
            <span>{{ report.targetUser.name || report.targetUser.id }}</span>
          </dd>
        </div>
        <div v-if="report.targetRule">
          <dt>被举报规则</dt>
          <dd>{{ report.targetRule.name || '-' }}</dd>
        </div>
        <div v-if="report.targetRule?.authorId">
          <dt>规则作者</dt>
          <dd>{{ report.targetRule.authorName || '-' }}（{{ report.targetRule.authorId }}）</dd>
        </div>
        <div>
          <dt>提交时间</dt>
          <dd>{{ formatTime(report.createdAt) }}</dd>
        </div>
      </dl>

      <section v-if="report.punishment" class="detail-section punishment-summary">
        <h3>处罚摘要</h3>
        <div class="punishment-tags">
          <el-tag :type="report.punishment.active ? 'danger' : 'info'">
            {{ report.punishment.active ? '处罚生效中' : '处罚已撤销' }}
          </el-tag>
          <el-tag>{{ scopeText[report.punishment.scope] }}</el-tag>
          <el-tag v-if="report.punishment.banDays" type="warning">
            封禁 {{ report.punishment.banDays }} 天
          </el-tag>
          <el-tag v-if="report.punishment.ruleRemoved" type="warning">规则已下架</el-tag>
        </div>
        <p v-if="report.punishment.bannedUntil">
          封禁截止：{{ formatTime(report.punishment.bannedUntil) }}
        </p>
        <p> 关联关闭 {{ report.punishment.affectedReportIds.length }} 条举报</p>
        <p v-if="report.punishment.revokedAt">
          撤销时间：{{ formatTime(report.punishment.revokedAt) }}
        </p>
      </section>

      <section v-if="report.mergedByPunishmentId" class="detail-section merged-notice">
        该举报已由同一对象的其他处罚合并关闭。
      </section>

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
            <span v-if="log.params?.banDays">封禁 {{ log.params.banDays }} 天</span>
            <p>{{ log.note || '无备注' }}</p>
          </li>
        </ul>
      </section>

      <footer class="detail-actions">
        <el-button
          type="danger"
          v-if="canBanUser"
          :disabled="report.status !== 'pending'"
          @click="$emit('action', 'ban_user')"
        >
          封禁用户
        </el-button>
        <el-button
          type="warning"
          v-if="canBanRule"
          :disabled="report.status !== 'pending'"
          @click="$emit('action', 'ban_rule')"
        >
          下架规则
        </el-button>
        <el-button
          v-if="canBanRule"
          type="danger"
          :disabled="report.status !== 'pending' || !hasRuleAuthor"
          :title="hasRuleAuthor ? '' : '缺少规则作者 ID，无法封禁作者'"
          @click="$emit('action', 'ban_user')"
        >
          封禁作者
        </el-button>
        <el-button
          v-if="canBanRule"
          type="danger"
          :disabled="report.status !== 'pending' || !hasRuleAuthor"
          :title="hasRuleAuthor ? '' : '缺少规则作者 ID，无法封禁作者'"
          @click="$emit('action', 'ban_both')"
        >
          下架并封禁作者
        </el-button>
        <el-button
          v-if="report.status === 'pending'"
          :disabled="report.status !== 'pending'"
          @click="$emit('action', 'dismiss')"
        >
          驳回
        </el-button>
        <el-button
          v-if="report.status === 'resolved' && report.punishment?.active"
          type="primary"
          plain
          @click="$emit('action', 'revoke')"
        >
          撤销惩罚
        </el-button>
      </footer>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getReportReporter, type Report, type ReportAction } from '../../api/report'
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
  ban_rule: '下架规则',
  ban_both: '下架规则并封禁作者',
  dismiss: '驳回',
  revoke: '撤销惩罚',
}

const scopeText: Record<string, string> = {
  user: '处罚用户',
  rule: '处罚规则',
  both: '处罚规则和作者',
}

const statusText = computed(() => {
  if (!props.report) return ''
  return props.report.status === 'pending' ? '待处理' : props.report.status === 'resolved' ? '已处理' : '已驳回'
})

const canBanUser = computed(() => props.report?.targetType === 'user' || props.report?.targetType === 'player_behavior')
const canBanRule = computed(() => props.report?.targetType === 'rule' || props.report?.targetType === 'review')
const hasRuleAuthor = computed(() => Boolean(props.report?.targetRule?.authorId))

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

.reporter-cell,
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reporter-cell img,
.user-cell img {
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

.punishment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.merged-notice {
  color: #8a5b00;
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
  flex-wrap: wrap;
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
