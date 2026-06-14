<template>
  <div class="admin-report-page">
    <header class="report-header">
      <div>
        <h1>举报审核</h1>
        <p>查询举报，处理用户封禁、规则下架和处罚撤销。</p>
      </div>
      <div class="header-actions">
        <el-tag type="danger" size="large">待处理 {{ pendingCount }}</el-tag>
        <el-button :loading="loading" @click="refreshCurrentView">刷新</el-button>
      </div>
    </header>

    <section class="id-search">
      <div>
        <strong>按举报 ID 精确查询</strong>
        <span>查询时暂时忽略下方列表筛选条件</span>
      </div>
      <el-input
        v-model="reportIdQuery"
        clearable
        placeholder="输入唯一举报 ID"
        @keyup.enter="loadReportById"
        @clear="clearIdQuery"
      />
      <el-button type="primary" :loading="loading" @click="loadReportById">查询</el-button>
    </section>

    <section class="filter-bar" :class="{ disabled: idQueryMode }">
      <el-select v-model="filters.status" placeholder="状态" :disabled="idQueryMode">
        <el-option label="全部状态" value="all" />
        <el-option label="待处理" value="pending" />
        <el-option label="已处理" value="resolved" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-select v-model="filters.targetType" placeholder="举报类型" :disabled="idQueryMode">
        <el-option label="全部类型" value="all" />
        <el-option label="用户" value="user" />
        <el-option label="规则" value="rule" />
        <el-option label="评价" value="review" />
        <el-option label="对局行为" value="player_behavior" />
      </el-select>
      <el-input
        v-model="filters.targetUser"
        clearable
        :disabled="idQueryMode"
        placeholder="被举报用户 ID / 名称"
        @keyup.enter="loadReports"
      />
      <el-input
        v-model="filters.targetRule"
        clearable
        :disabled="idQueryMode"
        placeholder="被举报规则 ID / 名称"
        @keyup.enter="loadReports"
      />
      <el-button type="primary" :disabled="idQueryMode" @click="loadReports">筛选</el-button>
    </section>

    <div v-if="loading && reports.length === 0" class="empty-state">正在加载举报列表...</div>
    <el-empty v-else-if="!loading && reports.length === 0" description="暂无举报记录" />

    <div v-else class="report-layout">
      <aside class="report-list">
        <ReportListItem
          v-for="report in reports"
          :key="report.id"
          :report="report"
          :active="selectedId === report.id"
          @select="selectReport(report.id)"
        />
      </aside>

      <AdminReportDetail
        :report="selectedReport"
        @action="handleAction"
      />
    </div>

    <el-dialog
      v-model="punishmentDialog.visible"
      :title="punishmentDialog.title"
      width="500px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item v-if="needsBanDays" label="封禁时长" required>
          <el-select v-model="punishmentDialog.banDays" placeholder="请选择封禁时长">
            <el-option
              v-for="days in banDayOptions"
              :key="days"
              :label="`${days} 天`"
              :value="days"
            />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="punishmentDialog.action === 'ban_rule'"
          title="确认后该规则将直接从规则市场下架。"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-alert
          v-if="punishmentDialog.action === 'ban_both'"
          title="确认后将下架规则，并按所选时长封禁规则作者。"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-form-item label="处理备注">
          <el-input
            v-model="punishmentDialog.note"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
            placeholder="填写处理说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="punishmentDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitPunishment">确认执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  reportApi,
  type BanDays,
  type Report,
  type ReportAction,
  type ReportActionParams,
  type ReportQuery,
} from '../api/report'
import ReportListItem from '../components/report/ReportListItem.vue'
import AdminReportDetail from '../components/report/AdminReportDetail.vue'

const banDayOptions: BanDays[] = [1, 3, 5, 7, 30]
const loading = ref(false)
const submitting = ref(false)
const reports = ref<Report[]>([])
const selectedId = ref('')
const pendingCount = ref(0)
const reportIdQuery = ref('')
const idQueryMode = ref(false)
const filters = reactive<ReportQuery>({
  status: 'pending',
  targetType: 'all',
  keyword: '',
  targetUser: '',
  targetRule: '',
})
const punishmentDialog = reactive<{
  visible: boolean
  title: string
  action: ReportAction
  banDays?: BanDays
  note: string
}>({
  visible: false,
  title: '',
  action: 'ban_user',
  banDays: 1,
  note: '',
})

const selectedReport = computed(() => reports.value.find(report => report.id === selectedId.value) || null)
const needsBanDays = computed(() => punishmentDialog.action === 'ban_user' || punishmentDialog.action === 'ban_both')

function selectReport(reportId: string) {
  selectedId.value = reportId
}

async function loadCounts() {
  const result = await reportApi.counts()
  if (result.success) pendingCount.value = result.data?.pending || 0
}

function applyReports(nextReports: Report[]) {
  reports.value = nextReports
  if (selectedId.value && !reports.value.some(report => report.id === selectedId.value)) {
    selectedId.value = ''
  }
  if (!selectedId.value && reports.value.length > 0) selectedId.value = reports.value[0].id
}

async function loadReports() {
  idQueryMode.value = false
  loading.value = true
  const result = await reportApi.list(filters)
  loading.value = false

  if (!result.success) {
    ElMessage.error(result.message || '举报列表加载失败')
    return
  }

  applyReports(result.data || [])
  await loadCounts()
}

async function loadReportById() {
  const reportId = reportIdQuery.value.trim()
  if (!reportId) {
    ElMessage.warning('请输入举报 ID')
    return
  }

  loading.value = true
  const result = await reportApi.get(reportId)
  loading.value = false
  idQueryMode.value = true

  if (!result.success || !result.data) {
    applyReports([])
    ElMessage.error(result.message || '未找到该举报')
    return
  }

  applyReports([result.data])
  selectedId.value = result.data.id
  await loadCounts()
}

async function clearIdQuery() {
  if (!idQueryMode.value) return
  idQueryMode.value = false
  await loadReports()
}

function refreshCurrentView() {
  if (idQueryMode.value) {
    void loadReportById()
    return
  }
  void loadReports()
}

function actionTitle(action: ReportAction, report: Report) {
  if (action === 'ban_rule') return '下架规则'
  if (action === 'ban_both') return '下架规则并封禁作者'
  if (action === 'ban_user' && (report.targetType === 'rule' || report.targetType === 'review')) {
    return '封禁规则作者'
  }
  return '封禁用户'
}

function openPunishmentDialog(action: ReportAction) {
  const report = selectedReport.value
  if (!report) return
  punishmentDialog.action = action
  punishmentDialog.title = actionTitle(action, report)
  punishmentDialog.banDays = 1
  punishmentDialog.note = ''
  punishmentDialog.visible = true
}

function buildActionParams(report: Report, action: ReportAction): ReportActionParams {
  const targetsRuleAuthor = action === 'ban_both'
    || (action === 'ban_user' && (report.targetType === 'rule' || report.targetType === 'review'))
  const fallbackUserId = report.targetType === 'user' || report.targetType === 'player_behavior'
    ? report.targetId
    : undefined
  const fallbackRuleId = report.targetType === 'rule' || report.targetType === 'review'
    ? report.targetId
    : undefined
  return {
    targetType: report.targetType,
    targetId: report.targetId,
    targetUserId: targetsRuleAuthor ? report.targetRule?.authorId : report.targetUser?.id || fallbackUserId,
    targetRuleId: report.targetRule?.id || report.context?.ruleId || fallbackRuleId,
    ruleAuthorId: report.targetRule?.authorId,
    banDays: needsBanDays.value ? punishmentDialog.banDays : undefined,
  }
}

async function runAction(action: ReportAction, note: string, params: ReportActionParams) {
  const report = selectedReport.value
  if (!report) return

  submitting.value = true
  const result = await reportApi.action(report.id, { action, note, params })
  submitting.value = false
  if (!result.success) {
    ElMessage.error(result.message || '处理失败')
    return
  }

  punishmentDialog.visible = false
  ElMessage.success(action === 'revoke' ? '惩罚已撤销' : '处理完成')
  if (idQueryMode.value) {
    await loadReportById()
  } else {
    await loadReports()
  }
}

async function submitPunishment() {
  const report = selectedReport.value
  if (!report) return
  if (needsBanDays.value && !punishmentDialog.banDays) {
    ElMessage.warning('请选择封禁时长')
    return
  }
  await runAction(
    punishmentDialog.action,
    punishmentDialog.note.trim(),
    buildActionParams(report, punishmentDialog.action),
  )
}

async function confirmSimpleAction(action: Extract<ReportAction, 'dismiss' | 'revoke'>) {
  const report = selectedReport.value
  if (!report) return
  const title = action === 'revoke' ? '撤销惩罚' : '驳回举报'
  const message = action === 'revoke'
    ? '确认撤销本次惩罚吗？用户封禁、规则下架及关联关闭的举报将被恢复。'
    : '确认驳回该举报吗？'
  try {
    const result = await ElMessageBox.prompt(message, title, {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '处理备注（可选）',
      inputValidator: (value: string) => (value || '').trim().length <= 300 || '备注不能超过 300 字',
    })
    await runAction(action, (result.value || '').trim(), {
      targetType: report.targetType,
      targetId: report.targetId,
      targetUserId: report.targetUser?.id
        || (report.targetType === 'user' || report.targetType === 'player_behavior' ? report.targetId : undefined),
      targetRuleId: report.targetRule?.id
        || report.context?.ruleId
        || (report.targetType === 'rule' || report.targetType === 'review' ? report.targetId : undefined),
      ruleAuthorId: report.targetRule?.authorId,
    })
  } catch {
    // User cancelled the confirmation dialog.
  }
}

function handleAction(action: ReportAction) {
  if (action === 'dismiss' || action === 'revoke') {
    void confirmSimpleAction(action)
    return
  }
  openPunishmentDialog(action)
}

onMounted(() => {
  void loadReports()
})
</script>

<style scoped>
.admin-report-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f6fa;
  color: #252633;
  text-align: left;
}

.report-header,
.id-search,
.filter-bar,
.empty-state {
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px;
  margin-bottom: 16px;
}

.report-header h1 {
  margin: 0;
  font-size: 26px;
}

.report-header p {
  margin: 6px 0 0;
  color: #4a5063;
}

.header-actions,
.id-search {
  display: flex;
  align-items: center;
  gap: 12px;
}

.id-search {
  padding: 16px;
  margin-bottom: 12px;
}

.id-search div {
  display: flex;
  flex-direction: column;
  min-width: 220px;
}

.id-search span {
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
}

.id-search :deep(.el-input) {
  flex: 1;
}

.filter-bar {
  display: grid;
  grid-template-columns: 140px 160px minmax(260px, 1fr) minmax(260px, 1fr) auto;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.filter-bar :deep(.el-button) {
  width: auto;
}

.filter-bar.disabled {
  opacity: 0.65;
}

.empty-state {
  padding: 36px;
  text-align: center;
  color: #4a5063;
}

.report-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.42fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 330px);
  overflow-y: auto;
  padding-right: 4px;
}

:deep(.el-dialog .el-select) {
  width: 100%;
}

:deep(.el-dialog .el-alert) {
  margin-bottom: 18px;
}

@media (max-width: 1200px) {
  .filter-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .report-header,
  .id-search {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-bar,
  .report-layout {
    grid-template-columns: 1fr;
  }

  .report-list {
    max-height: none;
  }
}
</style>
