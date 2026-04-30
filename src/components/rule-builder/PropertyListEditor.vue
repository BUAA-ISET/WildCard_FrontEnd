<template>
  <section class="property-list">
    <div class="section-title">
      <span>{{ title }}</span>
      <el-button size="small" @click="$emit('add')">添加属性</el-button>
    </div>
    <div v-if="properties.length === 0" class="empty-text">暂无属性</div>
    <div v-for="property in properties" :key="property.id" class="property-item">
      <div class="property-grid">
        <el-input v-model="property.name" placeholder="属性名" />
        <el-select v-model="property.type" @change="handleTypeChange(property)">
          <el-option label="整数" value="int" />
          <el-option label="枚举" value="enum" />
        </el-select>
        <el-input-number v-model="property.default" controls-position="right" />
        <el-button class="delete-btn" text @click="$emit('remove', property.id)">删除</el-button>
      </div>
      <div v-if="showIntRange && property.type === 'int'" class="range-row">
        <span>取值范围</span>
        <el-input-number
          v-model="property.lowerBound"
          controls-position="right"
          :min="CARD_INT_MIN"
          :max="property.upperBound ?? CARD_INT_MAX"
          @change="normalizeRange(property)"
        />
        <el-input-number
          v-model="property.upperBound"
          controls-position="right"
          :min="property.lowerBound ?? CARD_INT_MIN"
          :max="CARD_INT_MAX"
          @change="normalizeRange(property)"
        />
      </div>
      <div v-if="property.type === 'enum'" class="enum-list">
        <div class="enum-title">
          <span>枚举项</span>
          <el-button size="small" text @click="addEnumOption(property)">添加</el-button>
        </div>
        <div v-for="option in property.config" :key="option.id" class="enum-row">
          <el-input v-model="option.display" placeholder="显示名" />
          <el-input-number v-model="option.value" controls-position="right" />
          <el-button text @click="removeEnumOption(property, option.value)">删除</el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PropertyDraft } from '../../types/ruleBuilder'
import { CARD_INT_MAX, CARD_INT_MIN } from '../../utils/ruleBuilder'

defineProps<{
  title: string
  properties: PropertyDraft[]
  showIntRange?: boolean
}>()

defineEmits<{
  (event: 'add'): void
  (event: 'remove', propertyId: string): void
}>()

const handleTypeChange = (property: PropertyDraft) => {
  if (property.type === 'int') {
    property.lowerBound = property.lowerBound ?? property.default
    property.upperBound = property.upperBound ?? property.default
    normalizeRange(property)
  }

  if (property.type === 'enum' && (!property.config || property.config.length === 0)) {
    property.config = [
      { id: createEnumOptionId(), display: '选项一', value: 0 },
      { id: createEnumOptionId(), display: '选项二', value: 1 },
    ]
  }
}

const normalizeRange = (property: PropertyDraft) => {
  const lowerBound = Math.max(CARD_INT_MIN, Math.min(CARD_INT_MAX, property.lowerBound ?? property.default))
  const upperBound = Math.max(lowerBound, Math.min(CARD_INT_MAX, property.upperBound ?? property.default))
  property.lowerBound = lowerBound
  property.upperBound = upperBound

  if (property.default < lowerBound) {
    property.default = lowerBound
  }

  if (property.default > upperBound) {
    property.default = upperBound
  }
}

const addEnumOption = (property: PropertyDraft) => {
  const nextValue = Math.max(-1, ...(property.config || []).map(option => option.value)) + 1
  property.config = [...(property.config || []), { id: createEnumOptionId(), display: `选项${nextValue}`, value: nextValue }]
}

const removeEnumOption = (property: PropertyDraft, value: number) => {
  property.config = (property.config || []).filter(option => option.value !== value)
}

const createEnumOptionId = () => `enum-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
</script>

<style scoped>
.property-list {
  padding: 14px 0;
  border-top: 1px solid #edf0f5;
}

.section-title,
.enum-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: #303644;
  font-size: 14px;
  font-weight: 700;
}

.empty-text {
  color: #8790a0;
  font-size: 13px;
}

.property-item {
  padding: 12px;
  border: 1px solid #e1e5ed;
  border-radius: 8px;
  background: #fbfcfe;
}

.property-item + .property-item {
  margin-top: 10px;
}

.property-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 82px 96px 42px;
  gap: 8px;
  align-items: center;
}

.property-grid :deep(.el-input),
.property-grid :deep(.el-select),
.property-grid :deep(.el-input-number) {
  width: 100%;
  min-width: 0;
}

.range-row {
  display: grid;
  grid-template-columns: 64px 1fr 1fr;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
  color: #596170;
  font-size: 12px;
}

.range-row :deep(.el-input-number) {
  width: 100%;
  min-width: 0;
}

.delete-btn {
  color: #b34b4b;
  min-width: 0;
  padding: 0;
}

.enum-list {
  margin-top: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #fff;
}

.enum-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px 42px;
  gap: 8px;
  align-items: center;
}

.enum-row :deep(.el-input),
.enum-row :deep(.el-input-number) {
  width: 100%;
  min-width: 0;
}

.enum-row :deep(.el-button) {
  min-width: 0;
  padding: 0;
}

.enum-row + .enum-row {
  margin-top: 8px;
}
</style>
