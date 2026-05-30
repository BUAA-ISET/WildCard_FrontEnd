<template>
  <aside class="structure-panel">
    <div class="panel-header">
      <h2>规则结构</h2>
      <p>维护基础信息、固有类属性和牌型</p>
    </div>
    <div class="panel-body">
      <section class="basic-section">
        <div class="section-title">基础信息</div>
        <el-form label-position="top">
          <el-form-item label="规则名称">
            <el-input v-model="design.info.name" />
          </el-form-item>
          <el-form-item label="游玩人数">
            <el-input-number v-model="design.info.playerCount" :min="2" :max="12" />
          </el-form-item>
          <el-form-item label="简介">
            <el-input v-model="design.info.description" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
        <div class="object-summary">
          <div>
            <strong>{{ objectPool.players.length }}</strong>
            <span>玩家对象</span>
          </div>
          <div>
            <strong>{{ objectPool.cards.length }}</strong>
            <span>牌对象</span>
          </div>
          <div>
            <strong>{{ objectPool.table.name }}</strong>
            <span>牌桌对象</span>
          </div>
        </div>
      </section>

      <section class="basic-section">
        <div class="section-title">牌型</div>
        <div class="cardset-list">
          <button
            v-for="cardset in design.cardsets"
            :key="cardset.id"
            type="button"
            class="cardset-button"
            :class="{ active: cardset.id === activeCardsetId }"
            @click="$emit('select-cardset', cardset.id)"
          >
            <span>{{ cardset.name }}</span>
            <small>#{{ cardset.id }}</small>
          </button>
        </div>
        <div class="cardset-actions">
          <el-button size="small" @click="$emit('add-cardset')">新增牌型</el-button>
          <el-button size="small" :disabled="design.cardsets.length <= 1" @click="$emit('remove-cardset', activeCardsetId)">
            删除当前
          </el-button>
        </div>
        <div v-if="activeCardset" class="cardset-editor">
          <el-form label-position="top">
            <el-form-item label="牌型名称">
              <el-input v-model="activeCardset.name" />
            </el-form-item>
          </el-form>
          <PropertyListEditor
            title="牌型属性"
            :properties="activeCardset.properties"
            @add="addActiveCardsetProperty"
            @remove="removeActiveCardsetProperty"
          />
        </div>
      </section>

      <section class="basic-section">
        <div class="section-title">
          <span>牌型比较</span>
          <el-button size="small" @click="$emit('add-cardset-comparison')">新增比较</el-button>
        </div>
        <div v-if="design.cardsetComparisons.length === 0" class="empty-text">暂无比较流程</div>
        <div
          v-for="comparison in design.cardsetComparisons"
          :key="comparison.id"
          class="comparison-item"
          :class="{ active: comparison.id === activeComparisonId }"
        >
          <button class="comparison-select" type="button" @click="$emit('select-comparison', comparison.id)">
            编辑流程
          </button>
          <div class="comparison-info">
            <strong>{{ getComparisonTitle(comparison) }}</strong>
            <small>#{{ comparison.id }}</small>
          </div>
          <el-button
            size="small"
            text
            type="danger"
            :disabled="design.cardsetComparisons.length <= 1"
            @click="$emit('remove-cardset-comparison', comparison.id)"
          >
            删除
          </el-button>
        </div>
      </section>

      <section v-for="classDraft in classList" :key="classDraft.name" class="class-section">
        <div class="class-title">{{ classDraft.displayName }}</div>
        <section v-if="classDraft.name === 'table'" class="readonly-property-list">
          <div class="section-title">
            <span>默认属性</span>
            <small>系统维护</small>
          </div>
          <div class="readonly-property-item">
            <span>玩家池</span>
            <strong>{{ objectPool.players.length }} 个玩家对象</strong>
          </div>
          <div class="readonly-property-item">
            <span>卡牌池</span>
            <strong>{{ objectPool.cards.length }} 个牌对象</strong>
          </div>
          <div class="readonly-property-item">
            <span>本轮应出牌者</span>
            <strong>{{ String(objectPool.table.properties['本轮应出牌者'] || '暂无') }}</strong>
          </div>
        </section>
        <PropertyListEditor
          v-else
          title="默认属性"
          :properties="classDraft.defaultProperties"
          :show-int-range="classDraft.name === 'card'"
          @add="$emit('add-class-property', classDraft.name, 'default')"
          @remove="$emit('remove-class-property', classDraft.name, 'default', $event)"
        />
        <PropertyListEditor
          title="自定义属性"
          :properties="classDraft.userProperties"
          @add="$emit('add-class-property', classDraft.name, 'user')"
          @remove="$emit('remove-class-property', classDraft.name, 'user', $event)"
        />
        <section class="method-list">
          <div class="section-title">
            <span>方法</span>
            <el-button size="small" @click="$emit('add-method', classDraft.name)">添加方法</el-button>
          </div>
          <div v-if="classDraft.methods.length === 0" class="empty-text">暂无方法</div>
          <div
            v-for="method in classDraft.methods"
            :key="method.id"
            class="method-item"
            :class="{ active: method.id === activeMethodId }"
          >
            <button class="method-select" type="button" @click="$emit('select-method', classDraft.name, method.id)">
              编辑流程
            </button>
            <div class="method-grid">
              <el-input v-model="method.name" placeholder="方法名" />
              <el-select :teleported="false" v-model="method.returns" placeholder="返回值">
                <el-option label="无返回值" :value="null" />
                <el-option label="整数" value="int" />
                <el-option label="枚举" value="enum" />
              </el-select>
              <el-button class="delete-btn" text @click="$emit('remove-method', classDraft.name, method.id)">删除</el-button>
            </div>
            <div class="parameter-list">
              <div class="parameter-title">
                <span>参数</span>
                <el-button size="small" text @click="$emit('add-method-parameter', classDraft.name, method.id)">添加参数</el-button>
              </div>
              <div v-if="method.parameters.length === 0" class="empty-text">暂无参数</div>
              <div v-for="parameter in method.parameters" :key="parameter.id" class="parameter-row">
                <el-input v-model="parameter.name" placeholder="参数名" />
                <el-select :teleported="false" v-model="parameter.type">
                  <el-option label="整数" value="int" />
                  <el-option label="枚举" value="enum" />
                </el-select>
                <el-button text @click="$emit('remove-method-parameter', classDraft.name, method.id, parameter.id)">删除</el-button>
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PropertyListEditor from './PropertyListEditor.vue'
import type { CardsetComparisonDraft, RuleDesignDraft, RuleObjectPool } from '../../types/ruleBuilder'

const props = defineProps<{
  design: RuleDesignDraft
  activeCardsetId: string
  activeComparisonId: string | null
  activeMethodId: string | null
  objectPool: RuleObjectPool
}>()

const emit = defineEmits<{
  (event: 'select-cardset', cardsetId: string): void
  (event: 'add-cardset'): void
  (event: 'remove-cardset', cardsetId: string): void
  (event: 'add-cardset-property', cardsetId: string): void
  (event: 'remove-cardset-property', cardsetId: string, propertyId: string): void
  (event: 'select-comparison', comparisonId: string): void
  (event: 'add-cardset-comparison'): void
  (event: 'remove-cardset-comparison', comparisonId: string): void
  (event: 'add-class-property', className: string, propertyType: 'default' | 'user'): void
  (event: 'remove-class-property', className: string, propertyType: 'default' | 'user', propertyId: string): void
  (event: 'select-method', className: string, methodId: string): void
  (event: 'add-method', className: string): void
  (event: 'remove-method', className: string, methodId: string): void
  (event: 'add-method-parameter', className: string, methodId: string): void
  (event: 'remove-method-parameter', className: string, methodId: string, parameterId: string): void
}>()

const classList = computed(() => Object.values(props.design.classes))
const activeCardset = computed(() => props.design.cardsets.find(cardset => cardset.id === props.activeCardsetId))

const getCardsetName = (cardsetId: string) => {
  return props.design.cardsets.find(cardset => cardset.id === cardsetId)?.name || '未选择'
}

const getComparisonTitle = (comparison: CardsetComparisonDraft) => {
  return `${getCardsetName(comparison.cardsetA)} 与 ${getCardsetName(comparison.cardsetB)}`
}

const addActiveCardsetProperty = () => {
  if (activeCardset.value) {
    emit('add-cardset-property', activeCardset.value.id)
  }
}

const removeActiveCardsetProperty = (propertyId: string) => {
  if (activeCardset.value) {
    emit('remove-cardset-property', activeCardset.value.id, propertyId)
  }
}
</script>

<style scoped>
.structure-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #dde1ea;
  background: #fff;
  text-align: left;
}

.panel-header {
  padding: 18px;
  border-bottom: 1px solid #edf0f5;
}

.panel-header h2 {
  margin: 0 0 4px;
  color: #252633;
  font-size: 18px;
  font-weight: 700;
}

.panel-header p {
  margin: 0;
  color: #777f8f;
  font-size: 13px;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 18px 24px;
}

.basic-section,
.class-section {
  padding-bottom: 16px;
}

.basic-section + .basic-section,
.class-section {
  border-top: 1px solid #edf0f5;
  padding-top: 16px;
}

.section-title,
.class-title {
  margin-bottom: 12px;
  color: #252633;
  font-size: 16px;
  font-weight: 700;
}

.cardset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cardset-button {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #d8dce5;
  border-radius: 8px;
  background: #fbfcfe;
  color: #303644;
  cursor: pointer;
}

.cardset-button.active,
.cardset-button:hover {
  border-color: #afa6e8;
  background: #f5f2ff;
}

.cardset-button small {
  color: #7c8493;
}

.cardset-actions {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.cardset-editor {
  padding-top: 4px;
}

.comparison-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e1e5ed;
  border-radius: 8px;
  background: #fbfcfe;
}

.comparison-item + .comparison-item {
  margin-top: 8px;
}

.comparison-item.active {
  border-color: #afa6e8;
  background: #f5f2ff;
}

.comparison-select {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid #d8dce5;
  border-radius: 6px;
  background: #fff;
  color: #303644;
  cursor: pointer;
}

.comparison-info {
  min-width: 0;
}

.comparison-info strong,
.comparison-info small {
  display: block;
}

.comparison-info strong {
  overflow: hidden;
  color: #252633;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comparison-info small {
  margin-top: 3px;
  color: #7c8493;
}

.object-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.object-summary div {
  min-width: 0;
  padding: 10px;
  border: 1px solid #e1e5ed;
  border-radius: 8px;
  background: #fbfcfe;
}

.object-summary strong,
.object-summary span {
  display: block;
}

.object-summary strong {
  overflow: hidden;
  color: #252633;
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.object-summary span {
  margin-top: 4px;
  color: #737c8d;
  font-size: 12px;
}

.empty-text {
  color: #8790a0;
  font-size: 13px;
}

.readonly-property-list {
  padding: 14px 0;
  border-top: 1px solid #edf0f5;
}

.readonly-property-list small {
  color: #8790a0;
  font-size: 12px;
  font-weight: 500;
}

.readonly-property-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #e1e5ed;
  border-radius: 8px;
  background: #fbfcfe;
}

.readonly-property-item + .readonly-property-item {
  margin-top: 8px;
}

.readonly-property-item span {
  color: #596170;
  font-size: 13px;
}

.readonly-property-item strong {
  overflow: hidden;
  color: #252633;
  font-size: 13px;
  font-weight: 700;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.method-list {
  padding: 14px 0;
  border-top: 1px solid #edf0f5;
}

.method-item {
  padding: 12px;
  border: 1px solid #e1e5ed;
  border-radius: 8px;
  background: #fbfcfe;
}

.method-item + .method-item {
  margin-top: 10px;
}

.method-item.active {
  border-color: #afa6e8;
  background: #f7f4ff;
}

.method-select {
  width: 100%;
  height: 32px;
  margin-bottom: 10px;
  border: 1px solid #d8dce5;
  border-radius: 6px;
  background: #fff;
  color: #2a3040;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.method-select:hover {
  border-color: #afa6e8;
  background: #f5f2ff;
}

.method-grid,
.parameter-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 92px 42px;
  gap: 8px;
  align-items: center;
}

.method-grid :deep(.el-input),
.method-grid :deep(.el-select),
.parameter-row :deep(.el-input),
.parameter-row :deep(.el-select) {
  width: 100%;
  min-width: 0;
}

.delete-btn,
.parameter-row :deep(.el-button) {
  min-width: 0;
  padding: 0;
  color: #b34b4b;
}

.parameter-list {
  margin-top: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #fff;
}

.parameter-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: #303644;
  font-size: 13px;
  font-weight: 700;
}

.parameter-row + .parameter-row {
  margin-top: 8px;
}
</style>
