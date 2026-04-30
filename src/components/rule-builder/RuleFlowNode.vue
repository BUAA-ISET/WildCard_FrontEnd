<template>
  <div class="rule-node" :class="[`category-${data.category}`, { selected }]">
    <Handle v-if="!data.fixed" type="target" :position="Position.Left" />
    <div class="node-top">
      <span class="node-type">type {{ data.componentType }}</span>
      <span class="node-category">{{ categoryLabel }}</span>
    </div>
    <div class="node-title">{{ data.title }}</div>
    <div class="node-desc">{{ data.description }}</div>
    <template v-if="data.componentType === 16">
      <Handle id="true" type="source" :position="Position.Right" :style="{ top: '42%' }" />
      <Handle id="false" type="source" :position="Position.Right" :style="{ top: '72%' }" />
      <div class="branch-label true-label">是</div>
      <div class="branch-label false-label">否</div>
    </template>
    <Handle v-else-if="hasSourceHandle" type="source" :position="Position.Right" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { RuleNodeData } from '../../types/ruleBuilder'

const props = defineProps<{
  data: RuleNodeData
  selected?: boolean
}>()

const categoryMap: Record<string, string> = {
  control: '控制',
  action: '操作',
  execute: '执行',
  value: '值',
  logic: '逻辑',
  operation: '运算',
}

const terminalTypes = [18, 24, 28, 30]

const categoryLabel = computed(() => categoryMap[props.data.category] || '组件')
const hasSourceHandle = computed(() => !terminalTypes.includes(props.data.componentType))
</script>

<style scoped>
.rule-node {
  position: relative;
  width: 190px;
  min-height: 98px;
  padding: 12px 14px;
  border: 1px solid #cfd4df;
  border-left-width: 5px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(35, 34, 58, 0.08);
  text-align: left;
}

.rule-node.selected {
  border-color: #6d5bd0;
  box-shadow: 0 10px 26px rgba(109, 91, 208, 0.22);
}

.category-control {
  border-left-color: #5867dd;
}

.category-action {
  border-left-color: #d06b4f;
}

.category-execute {
  border-left-color: #3b8b7a;
}

.category-value {
  border-left-color: #7d8794;
}

.category-logic {
  border-left-color: #c15a8a;
}

.category-operation {
  border-left-color: #a46a3c;
}

.node-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: #6c7280;
  font-size: 12px;
}

.node-type,
.node-category {
  white-space: nowrap;
}

.node-title {
  color: #252633;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
}

.node-desc {
  margin-top: 6px;
  color: #6c7280;
  font-size: 12px;
  line-height: 1.45;
}

.branch-label {
  position: absolute;
  right: 12px;
  color: #555f70;
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
}

.true-label {
  top: 32%;
}

.false-label {
  top: 62%;
}
</style>
