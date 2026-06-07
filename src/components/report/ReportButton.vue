<template>
  <span class="report-button-wrap" @click.stop>
    <el-tooltip :content="tooltip" placement="top">
      <el-button
        :size="small ? 'small' : 'default'"
        :type="text ? 'danger' : undefined"
        :text="text"
        :circle="!text"
        class="report-button"
        :aria-label="tooltip"
        @click="open"
      >
        <el-icon><Warning /></el-icon>
        <span v-if="text" class="report-text">{{ tooltip }}</span>
      </el-button>
    </el-tooltip>

    <ReportModal
      v-model="visible"
      :target-type="targetType"
      :target-id="targetId"
      :target-label="targetLabel"
      :context="context"
      @submitted="emit('submitted')"
    />
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import ReportModal from './ReportModal.vue'
import type { ReportContext, ReportTargetType } from '../../api/report'
import { useUserStore } from '../../stores/userStore'

defineProps<{
  targetType: ReportTargetType
  targetId: string
  targetLabel?: string
  context?: ReportContext
  tooltip?: string
  small?: boolean
  text?: boolean
}>()

const emit = defineEmits<{
  opened: []
  submitted: []
}>()

const router = useRouter()
const userStore = useUserStore()
const visible = ref(false)

function open() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再提交举报')
    void router.push('/user-info')
    return
  }
  visible.value = true
  emit('opened')
}
</script>

<style scoped>
.report-button-wrap {
  display: inline-flex;
  align-items: center;
}

.report-button {
  border-color: #e3b1b1;
  color: #9f2f2f;
}

.report-button:hover,
.report-button:focus {
  background: #fff0f0;
  border-color: #d46b6b;
  color: #8a1f1f;
}

.report-text {
  margin-left: 4px;
}
</style>
