<template>
  <div class="rule-node" :class="[`category-${data.category}`, { selected }]">
    <Handle v-if="!data.fixed" type="target" :position="Position.Left" />
    <div class="node-top">
      <span class="node-type">type {{ data.componentType }}</span>
      <span class="node-category">{{ categoryLabel }}</span>
    </div>
    <div class="node-title">{{ data.title }}</div>
    <div class="node-desc">{{ data.description }}</div>
    <div v-if="data.componentType === 4" class="assignment-slots">
      <div class="assignment-slot left-slot" :class="{ filled: assignmentComponentValue }">
        <span class="slot-label">左值属性</span>
        <strong>{{ assignmentComponentValue ? `#${assignmentComponentValue}` : '连接属性访问组件' }}</strong>
        <Handle id="component" type="target" :position="Position.Left" class="assignment-handle component-handle" />
      </div>
      <div class="assignment-slot right-slot" :class="{ filled: assignmentRvalueValue }">
        <span class="slot-label">右值</span>
        <strong>{{ assignmentRvalueValue ? `#${assignmentRvalueValue}` : '连接值/运算组件' }}</strong>
        <Handle id="rvalue" type="target" :position="Position.Bottom" class="assignment-handle rvalue-handle" />
      </div>
    </div>
    <div v-if="data.componentType === 5" class="index-slot" :class="{ filled: indexValue }">
      <span class="slot-label">下标插槽</span>
      <strong>{{ indexValue ? `#${indexValue}` : '连接值/运算组件' }}</strong>
      <Handle id="index" type="target" :position="Position.Bottom" class="index-handle" />
    </div>
    <div v-if="data.componentType === 10" class="operation-slots">
      <div class="operation-slot" :class="{ filled: operationLvalValue }">
        <span class="slot-label">左操作数</span>
        <strong>{{ operationLvalValue ? `#${operationLvalValue}` : '连接值/运算组件' }}</strong>
        <Handle id="lval" type="target" :position="Position.Bottom" class="operation-handle lval-handle" />
      </div>
      <div class="operation-symbol">{{ operationSymbol }}</div>
      <div class="operation-slot" :class="{ filled: operationRvalValue }">
        <span class="slot-label">右操作数</span>
        <strong>{{ operationRvalValue ? `#${operationRvalValue}` : '连接值/运算组件' }}</strong>
        <Handle id="rval" type="target" :position="Position.Bottom" class="operation-handle rval-handle" />
      </div>
    </div>
    <div v-if="data.componentType === 14" class="comparison-slots">
      <div class="comparison-slot" :class="{ filled: comparisonLvalValue }">
        <span class="slot-label">左比较值</span>
        <strong>{{ comparisonLvalValue ? `#${comparisonLvalValue}` : '连接值组件' }}</strong>
        <Handle id="lval" type="target" :position="Position.Bottom" class="comparison-handle comparison-lval-handle" />
      </div>
      <div class="comparison-symbol">{{ comparisonSymbol }}</div>
      <div class="comparison-slot" :class="{ filled: comparisonRvalValue }">
        <span class="slot-label">右比较值</span>
        <strong>{{ comparisonRvalValue ? `#${comparisonRvalValue}` : '连接值组件' }}</strong>
        <Handle id="rval" type="target" :position="Position.Bottom" class="comparison-handle comparison-rval-handle" />
      </div>
    </div>
    <div v-if="[11, 13].includes(data.componentType)" class="logic-input-slot" :class="{ filled: logicComponentValue }">
      <span class="slot-label">逻辑条件</span>
      <strong>{{ logicComponentValue ? `#${logicComponentValue}` : '连接逻辑组件' }}</strong>
      <Handle id="component" type="target" :position="Position.Bottom" class="logic-input-handle" />
    </div>
    <div v-if="data.componentType === 12" class="binary-logic-slots">
      <div class="binary-logic-slot" :class="{ filled: binaryLogicLvalValue }">
        <span class="slot-label">左逻辑</span>
        <strong>{{ binaryLogicLvalValue ? `#${binaryLogicLvalValue}` : '连接逻辑组件' }}</strong>
        <Handle id="lval" type="target" :position="Position.Bottom" class="binary-logic-handle binary-lval-handle" />
      </div>
      <div class="binary-logic-symbol">{{ binaryLogicSymbol }}</div>
      <div class="binary-logic-slot" :class="{ filled: binaryLogicRvalValue }">
        <span class="slot-label">右逻辑</span>
        <strong>{{ binaryLogicRvalValue ? `#${binaryLogicRvalValue}` : '连接逻辑组件' }}</strong>
        <Handle id="rval" type="target" :position="Position.Bottom" class="binary-logic-handle binary-rval-handle" />
      </div>
    </div>
    <div v-if="data.componentType === 26" class="return-value-slot" :class="{ filled: returnValue }">
      <span class="slot-label">返回值</span>
      <strong>{{ returnValue && returnValue !== 'void' ? `#${returnValue}` : '连接值组件' }}</strong>
      <Handle id="return" type="target" :position="Position.Bottom" class="return-value-handle" />
    </div>
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

const terminalTypes = [18, 24, 26, 28, 30]

const categoryLabel = computed(() => categoryMap[props.data.category] || '组件')
const hasSourceHandle = computed(() => !terminalTypes.includes(props.data.componentType))
const indexValue = computed(() => {
  const value = props.data.content?.index
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const assignmentComponentValue = computed(() => {
  const value = props.data.content?.component
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const assignmentRvalueValue = computed(() => {
  const value = props.data.content?.rvalue
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const operationLvalValue = computed(() => {
  const value = props.data.content?.lval
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const operationRvalValue = computed(() => {
  const value = props.data.content?.rval
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const operationSymbol = computed(() => {
  const operatorMap = ['+', '-', '*', '/', '%']
  const operator = props.data.content?.operator
  return typeof operator === 'number' ? operatorMap[operator] || '+' : '+'
})
const comparisonLvalValue = computed(() => {
  const value = props.data.content?.lval
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const comparisonRvalValue = computed(() => {
  const value = props.data.content?.rval
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const comparisonSymbol = computed(() => {
  const operatorMap = ['==', '>', '<', '>=', '<=']
  const operator = props.data.content?.operator
  return typeof operator === 'number' ? operatorMap[operator] || '==' : '=='
})
const logicComponentValue = computed(() => {
  const value = props.data.content?.component
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const binaryLogicLvalValue = computed(() => {
  const value = props.data.content?.lval
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const binaryLogicRvalValue = computed(() => {
  const value = props.data.content?.rval
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
const binaryLogicSymbol = computed(() => {
  const operator = props.data.content?.operator
  return operator === 1 ? '或' : '与'
})
const returnValue = computed(() => {
  const value = props.data.content?.return
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
})
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

.assignment-slots {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.assignment-slot {
  position: relative;
  padding: 8px 10px 10px;
  border: 1px dashed #b8c2d4;
  border-radius: 6px;
  background: #f8f9fc;
  color: #697386;
  font-size: 12px;
}

.assignment-slot.filled {
  border-color: #78a68f;
  background: #f3faf6;
  color: #3f634f;
}

.assignment-slot strong {
  color: #252633;
  font-size: 12px;
}

.assignment-handle {
  width: 12px;
  height: 12px;
  border-color: #3b8b7a;
  background: #fff;
}

.component-handle {
  left: -7px;
  top: 50%;
}

.rvalue-handle {
  bottom: -7px;
}

.index-slot {
  position: relative;
  margin-top: 10px;
  padding: 9px 10px 12px;
  border: 1px dashed #b8c2d4;
  border-radius: 6px;
  background: #f8f9fc;
  color: #697386;
  font-size: 12px;
}

.index-slot.filled {
  border-color: #7e8fd6;
  background: #f4f6ff;
  color: #46506c;
}

.slot-label {
  display: block;
  margin-bottom: 3px;
  font-size: 11px;
}

.index-slot strong {
  color: #252633;
  font-size: 12px;
}

.index-handle {
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-color: #6d5bd0;
  background: #fff;
}

.operation-slots {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: 8px;
  margin-top: 10px;
}

.operation-slot {
  position: relative;
  min-width: 0;
  padding: 8px 8px 12px;
  border: 1px dashed #b8c2d4;
  border-radius: 6px;
  background: #f8f9fc;
  color: #697386;
  font-size: 12px;
}

.operation-slot.filled {
  border-color: #b98c5b;
  background: #fff8f1;
  color: #6d5034;
}

.operation-slot strong {
  display: block;
  overflow: hidden;
  color: #252633;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.operation-symbol {
  align-self: center;
  color: #a46a3c;
  font-size: 18px;
  font-weight: 800;
}

.operation-handle {
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-color: #a46a3c;
  background: #fff;
}

.lval-handle {
  left: 35%;
}

.rval-handle {
  left: 65%;
}

.comparison-slots {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: 8px;
  margin-top: 10px;
}

.comparison-slot {
  position: relative;
  min-width: 0;
  padding: 8px 8px 12px;
  border: 1px dashed #b8c2d4;
  border-radius: 6px;
  background: #f8f9fc;
  color: #697386;
  font-size: 12px;
}

.comparison-slot.filled {
  border-color: #c15a8a;
  background: #fff5fa;
  color: #6c3a52;
}

.comparison-slot strong {
  display: block;
  overflow: hidden;
  color: #252633;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comparison-symbol {
  align-self: center;
  color: #c15a8a;
  font-size: 16px;
  font-weight: 800;
}

.comparison-handle {
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-color: #c15a8a;
  background: #fff;
}

.comparison-lval-handle {
  left: 35%;
}

.comparison-rval-handle {
  left: 65%;
}

.logic-input-slot {
  position: relative;
  margin-top: 10px;
  padding: 9px 10px 12px;
  border: 1px dashed #b8c2d4;
  border-radius: 6px;
  background: #f8f9fc;
  color: #697386;
  font-size: 12px;
}

.logic-input-slot.filled {
  border-color: #c15a8a;
  background: #fff5fa;
  color: #6c3a52;
}

.logic-input-slot strong {
  color: #252633;
  font-size: 12px;
}

.logic-input-handle {
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-color: #c15a8a;
  background: #fff;
}

.binary-logic-slots {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: 8px;
  margin-top: 10px;
}

.binary-logic-slot {
  position: relative;
  min-width: 0;
  padding: 8px 8px 12px;
  border: 1px dashed #b8c2d4;
  border-radius: 6px;
  background: #f8f9fc;
  color: #697386;
  font-size: 12px;
}

.binary-logic-slot.filled {
  border-color: #c15a8a;
  background: #fff5fa;
  color: #6c3a52;
}

.binary-logic-slot strong {
  display: block;
  overflow: hidden;
  color: #252633;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.binary-logic-symbol {
  align-self: center;
  color: #c15a8a;
  font-size: 16px;
  font-weight: 800;
}

.binary-logic-handle {
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-color: #c15a8a;
  background: #fff;
}

.binary-lval-handle {
  left: 35%;
}

.binary-rval-handle {
  left: 65%;
}

.return-value-slot {
  position: relative;
  margin-top: 10px;
  padding: 9px 10px 12px;
  border: 1px dashed #b8c2d4;
  border-radius: 6px;
  background: #f8f9fc;
  color: #697386;
  font-size: 12px;
}

.return-value-slot.filled {
  border-color: #5867dd;
  background: #f4f6ff;
  color: #46506c;
}

.return-value-slot strong {
  color: #252633;
  font-size: 12px;
}

.return-value-handle {
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-color: #5867dd;
  background: #fff;
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
