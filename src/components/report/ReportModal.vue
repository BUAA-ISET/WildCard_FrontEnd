<template>
  <el-dialog
    :model-value="modelValue"
    title="提交举报"
    width="520px"
    class="report-dialog"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="resetForm"
  >
    <el-form label-position="top" class="report-form">
      <el-form-item label="举报对象">
        <el-input :model-value="targetLabelText" disabled />
      </el-form-item>

      <el-form-item label="举报理由" required>
        <el-input
          v-model="reason"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="请填写举报理由"
        />
      </el-form-item>

      <el-form-item label="补充说明">
        <el-input
          v-model="details"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请描述具体情况、时间点或你观察到的证据"
        />
      </el-form-item>

      <el-form-item label="举报人">
        <el-input :model-value="reporterText" disabled />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交举报</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { reportApi, type ReportContext, type ReportTargetType } from '../../api/report'
import { useUserStore } from '../../stores/userStore'

const props = defineProps<{
  modelValue: boolean
  targetType: ReportTargetType
  targetId: string
  targetLabel?: string
  context?: ReportContext
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: []
}>()

const route = useRoute()
const userStore = useUserStore()
const reason = ref('')
const details = ref('')
const submitting = ref(false)

const targetLabelText = computed(() => props.targetLabel || `${props.targetType}:${props.targetId}`)
const reporterText = computed(() => userStore.username || userStore.email || userStore.id || '当前用户')

function close() {
  emit('update:modelValue', false)
}

function resetForm() {
  reason.value = ''
  details.value = ''
}

async function submit() {
  const trimmedReason = reason.value.trim()
  if (!trimmedReason) {
    ElMessage.warning('请填写举报理由')
    return
  }

  submitting.value = true
  const result = await reportApi.submit({
    reporterId: userStore.id,
    reporterName: userStore.username,
    reporterAvatar: userStore.avatar,
    targetType: props.targetType,
    targetId: props.targetId,
    reason: trimmedReason,
    details: details.value.trim(),
    context: {
      ...props.context,
      targetLabel: props.targetLabel || props.context?.targetLabel,
      sourcePath: route.fullPath,
    },
  })
  submitting.value = false

  if (!result.success) {
    ElMessage.error(result.message || '举报提交失败')
    return
  }

  ElMessage.success('举报已提交')
  emit('submitted')
  close()
}
</script>

<style scoped>
.report-form {
  text-align: left;
}

.report-form :deep(.el-select) {
  width: 100%;
}
</style>
