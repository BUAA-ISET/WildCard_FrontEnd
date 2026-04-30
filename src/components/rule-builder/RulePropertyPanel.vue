<template>
  <aside class="property-panel">
    <div class="panel-header">
      <h2>属性面板</h2>
      <p>编辑当前选中组件的 JSON 内容</p>
    </div>
    <div v-if="node" class="panel-body">
      <div class="node-summary">
        <div class="summary-title">{{ node.data.title }}</div>
        <div class="summary-meta">type {{ node.data.componentType }} · {{ node.data.description }}</div>
      </div>

      <div v-if="node.data.content" class="quick-fields">
        <template v-if="node.data.componentType === 1">
          <el-form-item label="对象">
            <el-select
              :model-value="getStringField('object')"
              placeholder="先选择对象"
              filterable
              @update:model-value="updateMethodCallObject"
            >
              <el-option
                v-for="object in availableObjects"
                :key="object.id"
                :label="`${object.name}（${classDisplayNameMap[object.className]}）`"
                :value="object.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="方法">
            <el-select
              :model-value="getStringField('method')"
              placeholder="选择对象后可选方法"
              :disabled="!selectedMethodCallObject"
              filterable
              @update:model-value="updateMethodCallMethod"
            >
              <el-option
                v-for="method in availableObjectMethods"
                :key="method.id"
                :label="method.name"
                :value="method.name"
              />
            </el-select>
          </el-form-item>
          <div class="method-params">
            <div class="method-param-title">参数</div>
            <div v-if="!selectedMethodCallObject" class="method-param-empty">请先选择对象</div>
            <div v-else-if="!selectedMethodCallMethod" class="method-param-empty">请选择方法后填写参数</div>
            <div v-else-if="selectedMethodCallParameters.length === 0" class="method-param-empty">该方法无需参数</div>
            <template v-else>
              <el-form-item
                v-for="(parameter, index) in selectedMethodCallParameters"
                :key="parameter.id"
                :label="`${parameterLabel(index)}（${parameter.name}:${parameter.type}）`"
              >
                <el-input
                  :model-value="getMethodCallParameter(index)"
                  :placeholder="`请输入${parameter.name}`"
                  @update:model-value="updateMethodCallParameter(index, $event)"
                />
              </el-form-item>
            </template>
          </div>
          <el-form-item label="返回值">
            <el-switch
              :model-value="getNumberField('hasReturn') === 1"
              disabled
            />
          </el-form-item>
        </template>

        <template v-if="[4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16].includes(node.data.componentType)">
          <el-form-item v-if="hasField('condition')" label="条件组件">
            <el-input :model-value="getStringField('condition')" @update:model-value="updateField('condition', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('component')" label="组件引用">
            <el-input :model-value="getStringField('component')" @update:model-value="updateField('component', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('rvalue')" label="右值组件">
            <el-input :model-value="getStringField('rvalue')" @update:model-value="updateField('rvalue', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('lval')" label="左值">
            <el-input :model-value="getStringField('lval')" @update:model-value="updateField('lval', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('rval')" label="右值">
            <el-input :model-value="getStringField('rval')" @update:model-value="updateField('rval', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('set')" label="集合">
            <el-input :model-value="getStringField('set')" @update:model-value="updateField('set', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('selection')" label="属性选择组件">
            <el-input :model-value="getStringField('selection')" @update:model-value="updateField('selection', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('ident')" label="对象/组件标识">
            <el-input :model-value="getStringField('ident')" @update:model-value="updateField('ident', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('property')" label="属性名">
            <el-input :model-value="getStringField('property')" @update:model-value="updateField('property', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('index')" label="下标">
            <el-input :model-value="getStringField('index')" @update:model-value="updateField('index', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('card_set')" label="牌组">
            <el-input :model-value="getStringField('card_set')" @update:model-value="updateField('card_set', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('card_rule')" label="牌型编号">
            <el-input :model-value="getStringField('card_rule')" @update:model-value="updateField('card_rule', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('operator')" label="运算符">
            <el-select :model-value="getNumberField('operator')" @update:model-value="updateField('operator', $event)">
              <el-option v-for="option in operatorOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="[8, 9].includes(node.data.componentType)">
          <el-form-item label="值">
            <el-input-number :model-value="getNumberField('value')" @update:model-value="updateField('value', $event || 0)" />
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 20">
          <el-form-item label="发牌数量">
            <el-input-number :model-value="getNumberField('count')" :min="1" @update:model-value="updateField('count', $event || 1)" />
          </el-form-item>
          <el-form-item label="属性范围">
            <el-input
              type="textarea"
              :rows="4"
              :model-value="getJsonField('prop_pair')"
              @update:model-value="updateJsonField('prop_pair', $event)"
            />
          </el-form-item>
        </template>

        <template v-if="[21, 22].includes(node.data.componentType)">
          <el-form-item label="时间限制">
            <el-input-number :model-value="getNumberField('timer')" :min="0" @update:model-value="updateField('timer', $event || 0)" />
          </el-form-item>
          <el-form-item v-if="node.data.componentType === 22" label="动作选项">
            <el-input
              type="textarea"
              :rows="4"
              :model-value="getJsonField('options')"
              @update:model-value="updateJsonField('options', $event)"
            />
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 24">
          <el-form-item label="结算结果">
            <el-radio-group :model-value="getNumberField('result')" @update:model-value="updateField('result', $event)">
              <el-radio-button :value="1">胜</el-radio-button>
              <el-radio-button :value="0">负</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 26">
          <el-form-item label="返回值">
            <el-input :model-value="getStringField('return')" @update:model-value="updateField('return', $event)" />
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 28">
          <el-form-item label="匹配结果">
            <el-radio-group :model-value="getNumberField('result')" @update:model-value="updateField('result', $event)">
              <el-radio-button :value="1">成功</el-radio-button>
              <el-radio-button :value="0">失败</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="牌型属性">
            <el-input
              type="textarea"
              :rows="4"
              :model-value="getJsonField('properties')"
              @update:model-value="updateJsonField('properties', $event)"
            />
          </el-form-item>
        </template>
      </div>

      <div v-if="node.data.componentType !== 1" class="raw-editor">
        <div class="raw-title">完整 content</div>
        <el-input
          type="textarea"
          :rows="10"
          :model-value="rawContentText"
          @update:model-value="updateRawContent"
        />
      </div>
    </div>
    <div v-else class="empty-state">
      选中画布中的组件后，可以在这里配置对象、属性、条件或返回值。
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { MethodDraft, RuleDesignDraft, RuleNodeDraft, RuleObjectPool, RuleRuntimeObject } from '../../types/ruleBuilder'
import { cloneContent } from '../../utils/ruleBuilder'

const props = defineProps<{
  node: RuleNodeDraft | null
  design: RuleDesignDraft
  objectPool: RuleObjectPool
}>()

const emit = defineEmits<{
  (event: 'update-content', nodeId: string, content: Record<string, unknown> | null): void
}>()

const operatorOptions = computed(() => {
  if (!props.node) {
    return []
  }

  if ([10].includes(props.node.data.componentType)) {
    return [
      { label: '+', value: 0 },
      { label: '-', value: 1 },
      { label: '*', value: 2 },
      { label: '/', value: 3 },
      { label: '%', value: 4 },
    ]
  }

  if ([11].includes(props.node.data.componentType)) {
    return [
      { label: '存在', value: 0 },
      { label: '任意', value: 1 },
    ]
  }

  if ([12].includes(props.node.data.componentType)) {
    return [
      { label: '与', value: 0 },
      { label: '或', value: 1 },
    ]
  }

  if ([6].includes(props.node.data.componentType)) {
    return [
      { label: '对象属性', value: 0 },
      { label: '组件属性', value: 1 },
      { label: '集合访问结果', value: 2 },
    ]
  }

  return [
    { label: '==', value: 0 },
    { label: '>', value: 1 },
    { label: '<', value: 2 },
    { label: '>=', value: 3 },
    { label: '<=', value: 4 },
  ]
})

const contentRecord = computed(() => props.node?.data.content || {})
const rawContentText = computed(() => JSON.stringify(props.node?.data.content ?? null, null, 2))
const classDisplayNameMap: Record<RuleRuntimeObject['className'], string> = {
  player: '玩家',
  card: '牌',
  table: '牌桌',
}

const availableObjects = computed(() => [
  ...props.objectPool.players,
  ...props.objectPool.cards,
  props.objectPool.table,
])

const selectedMethodCallObject = computed(() => {
  return availableObjects.value.find(object => object.id === getStringField('object')) || null
})

const availableObjectMethods = computed<MethodDraft[]>(() => {
  if (!selectedMethodCallObject.value) {
    return []
  }

  return props.design.classes[selectedMethodCallObject.value.className]?.methods || []
})

const selectedMethodCallMethod = computed(() => {
  return availableObjectMethods.value.find(method => method.name === getStringField('method')) || null
})

const selectedMethodCallParameters = computed(() => selectedMethodCallMethod.value?.parameters || [])

const hasField = (field: string) => Object.prototype.hasOwnProperty.call(contentRecord.value, field)

const getStringField = (field: string) => {
  const value = contentRecord.value[field]
  return typeof value === 'string' ? value : String(value || '')
}

const getNumberField = (field: string) => {
  const value = contentRecord.value[field]
  return typeof value === 'number' ? value : 0
}

const getJsonField = (field: string) => JSON.stringify(contentRecord.value[field] || [], null, 2)

const emitContent = (content: Record<string, unknown> | null) => {
  if (props.node) {
    emit('update-content', props.node.id, content)
  }
}

const updateField = (field: string, value: unknown) => {
  if (!props.node || props.node.data.content === null) {
    return
  }

  const nextContent = cloneContent(props.node.data.content) || {}
  nextContent[field] = value
  emitContent(nextContent)
}

const updateMethodCallObject = (objectId: string | number) => {
  const object = availableObjects.value.find(item => item.id === String(objectId))
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.object = object?.id || ''
  nextContent.method = ''
  nextContent.parameter = []
  nextContent.hasReturn = 0
  emitContent(nextContent)
}

const updateMethodCallMethod = (methodName: string | number) => {
  const method = availableObjectMethods.value.find(item => item.name === String(methodName))
  const currentParameters = Array.isArray(contentRecord.value.parameter) ? contentRecord.value.parameter : []
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.method = method?.name || ''
  nextContent.parameter = method ? method.parameters.map((_, index) => currentParameters[index] || '') : []
  nextContent.hasReturn = method?.returns ? 1 : 0
  emitContent(nextContent)
}

const getMethodCallParameter = (index: number) => {
  const parameters = contentRecord.value.parameter
  return Array.isArray(parameters) ? String(parameters[index] || '') : ''
}

const updateMethodCallParameter = (index: number, value: string | number) => {
  const method = selectedMethodCallMethod.value
  const parameters = Array.isArray(contentRecord.value.parameter) ? [...contentRecord.value.parameter] : []
  const expectedLength = method?.parameters.length || index + 1
  const nextParameters = Array.from({ length: expectedLength }, (_, parameterIndex) => {
    return parameterIndex === index ? String(value) : String(parameters[parameterIndex] || '')
  })

  updateField('parameter', nextParameters)
}

const parameterLabel = (index: number) => {
  const labels = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return `参数${labels[index] || index + 1}`
}

const updateJsonField = (field: string, value: string | number) => {
  try {
    updateField(field, JSON.parse(String(value)))
  } catch {
    ElMessage.warning('JSON 格式暂时不正确')
  }
}

const updateRawContent = (value: string | number) => {
  try {
    emitContent(JSON.parse(String(value)) as Record<string, unknown> | null)
  } catch {
    ElMessage.warning('完整 content 不是合法 JSON')
  }
}
</script>

<style scoped>
.property-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border-left: 1px solid #dde1ea;
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

.node-summary {
  margin-bottom: 18px;
  padding: 12px;
  border: 1px solid #e2e5ec;
  border-radius: 8px;
  background: #f8f9fc;
}

.summary-title {
  color: #252633;
  font-size: 17px;
  font-weight: 700;
}

.summary-meta {
  margin-top: 6px;
  color: #70798a;
  font-size: 12px;
  line-height: 1.45;
}

.quick-fields {
  margin-bottom: 18px;
}

.raw-title {
  margin-bottom: 8px;
  color: #4b5363;
  font-size: 13px;
  font-weight: 700;
}

.empty-state {
  overflow-y: auto;
  padding: 24px 20px;
  color: #70798a;
  font-size: 14px;
  line-height: 1.7;
}
</style>
