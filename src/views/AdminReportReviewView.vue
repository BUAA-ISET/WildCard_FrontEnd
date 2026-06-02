<template>
  <div class="admin-report-page">
    <header class="report-header">
      <div>
        <h1>举报审核</h1>
        <p>查看玩家、规则和评价举报，处理封禁或驳回操作。</p>
      </div>
      <div class="header-actions">
        <el-tag type="danger" size="large">待处理 {{ pendingCount }}</el-tag>
        <el-button :loading="loading" @click="loadReports">刷新</el-button>
      </div>
    </header>

    <section class="filter-bar">
      <el-select v-model="filters.status" placeholder="状态">
        <el-option label="全部状态" value="all" />
        <el-option label="待处理" value="pending" />
        <el-option label="已处理" value="resolved" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-select v-model="filters.targetType" placeholder="举报类型">
        <el-option label="全部类型" value="all" />
        <el-option label="用户" value="user" />
        <el-option label="规则" value="rule" />
        <el-option label="评价" value="review" />
        <el-option label="对局行为" value="player_behavior" />
      </el-select>
      <el-input
        v-model="filters.keyword"
        clearable
        placeholder="搜索目标、理由或说明"
        @keyup.enter="loadReports"
        @clear="loadReports"
      />
      <el-button type="primary" @click="loadReports">筛选</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reportApi, type Report, type ReportAction, type ReportQuery } from '../api/report'
import ReportListItem from '../components/report/ReportListItem.vue'
import AdminReportDetail from '../components/report/AdminReportDetail.vue'

const loading = ref(false)
const reports = ref<Report[]>([])
const selectedId = ref('')
const pendingCount = ref(0)
const filters = reactive<ReportQuery>({
  status: 'pending',
  targetType: 'all',
  keyword: '',
})

const selectedReport = computed(() => reports.value.find((report) => report.id === selectedId.value) || null)

function selectReport(reportId: string) {
  selectedId.value = reportId
}

async function loadCounts() {
  const result = await reportApi.counts()
  if (result.success) {
    pendingCount.value = result.data?.pending || 0
  }
}

async function loadReports() {
  loading.value = true
  const result = await reportApi.list(filters)
  loading.value = false

  if (!result.success) {
    ElMessage.error(result.message || '举报列表加载失败')
    return
  }

  reports.value = result.data || []
  if (selectedId.value && !reports.value.some((report) => report.id === selectedId.value)) {
    selectedId.value = ''
  }
  if (!selectedId.value && reports.value.length > 0) {
    selectedId.value = reports.value[0].id
  }
  await loadCounts()
}

async function handleAction(action: ReportAction) {
  if (!selectedReport.value) return

  const actionText = action === 'ban_user' ? '封禁用户' : action === 'ban_rule' ? '封禁规则' : '驳回举报'
  let note = ''
  try {
    const result = await ElMessageBox.prompt(
      `确认执行“${actionText}”吗？请填写处理备注。`,
      actionText,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '处理说明',
        inputValidator: (value: string) => {
          if ((value || '').trim().length > 300) return '备注不能超过 300 字'
          return true
        },
      },
    )
    note = (result.value || '').trim()
  } catch {
    return
  }

  const result = await reportApi.action(selectedReport.value.id, {
    action,
    note,
    params: {
      targetType: selectedReport.value.targetType,
      targetId: selectedReport.value.targetId,
    },
  })

  if (!result.success) {
    ElMessage.error(result.message || '处理失败')
    return
  }

  ElMessage.success('处理完成')
  await loadReports()
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
  letter-spacing: 0;
}

.report-header p {
  margin: 6px 0 0;
  color: #4a5063;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-bar {
  display: grid;
  grid-template-columns: 150px 170px minmax(240px, 1fr) auto;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
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
  max-height: calc(100vh - 245px);
  overflow-y: auto;
  padding-right: 4px;
}

@media (max-width: 980px) {
  .report-header,
  .filter-bar,
  .report-layout {
    grid-template-columns: 1fr;
  }

  .report-header {
    display: grid;
  }

  .report-list {
    max-height: none;
  }
}
</style>
