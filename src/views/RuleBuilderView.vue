<template>
  <div class="rule-builder-page">
    <header class="builder-header">
      <div>
        <h1>规则构建</h1>
        <p>{{ design.info.name }} · {{ design.info.playerCount }} 人</p>
      </div>
      <div class="header-actions">
        <el-button @click="backToCenter">返回列表</el-button>
        <el-button @click="openTutorial">教程</el-button>
        <el-button @click="openJsonImport">导入 JSON</el-button>
        <el-button @click="showJson = !showJson">{{ showJson ? '隐藏 JSON' : '显示 JSON' }}</el-button>
        <el-button type="primary" @click="saveDesign">保存草稿</el-button>
        <el-button
          type="success"
          :disabled="publishButtonDisabled"
          :loading="submitting"
          @click="uploadCompletedRule"
        >
          {{ publishButtonLabel }}
        </el-button>
        <span
          v-if="draftStatus === 'rejected' && rejectReason"
          class="reject-reason-inline"
        >
          驳回原因：{{ rejectReason }}
        </span>
      </div>
    </header>

    <el-dialog v-model="showJsonImport" title="根据 JSON 生成组件模块" width="720px">
      <el-input
        v-model="jsonImportText"
        type="textarea"
        :rows="18"
        placeholder="粘贴符合后端规则 JSON 格式的内容"
      />
      <template #footer>
        <el-button @click="showJsonImport = false">取消</el-button>
        <el-button type="primary" @click="importJsonToDesign">生成组件模块</el-button>
      </template>
    </el-dialog>

    <nav class="workspace-tabs">
      <button
        v-for="workspace in workspaces"
        :key="workspace.key"
        type="button"
        class="workspace-tab"
        :class="{ active: activeWorkspace === workspace.key }"
        @click="activeWorkspace = workspace.key"
      >
        {{ workspace.label }}
      </button>
    </nav>

    <main
      ref="builderMainRef"
      class="builder-main"
      :class="{ 'with-json': showJson, 'structure-mode': activeWorkspace === 'structure', 'fullscreen-mode': isFlowFullscreen }"
    >
      <RuleStructurePanel
        v-if="activeWorkspace === 'structure'"
        class="left-panel wide"
        :design="design"
        :active-cardset-id="activeCardsetId"
        :active-comparison-id="activeComparisonId"
        :active-method-id="activeMethodId"
        :object-pool="objectPool"
        @select-cardset="activeCardsetId = $event"
        @add-cardset="addCardset"
        @remove-cardset="removeCardset"
        @add-cardset-property="addCardsetProperty"
        @remove-cardset-property="removeCardsetProperty"
        @select-comparison="selectComparison"
        @add-cardset-comparison="addCardsetComparison"
        @remove-cardset-comparison="removeCardsetComparison"
        @add-class-property="addClassProperty"
        @remove-class-property="removeClassProperty"
        @select-method="selectMethod"
        @add-method="addMethod"
        @remove-method="removeMethod"
        @add-method-parameter="addMethodParameter"
        @remove-method-parameter="removeMethodParameter"
      />
      <RuleComponentPalette
        v-else
        class="left-panel"
        :scope="activeFlowScope"
        :templates="componentTemplates"
        @add-node="addNode"
      />

      <section v-if="activeWorkspace === 'structure'" class="structure-overview">
        <div class="overview-content">
          <h2>构建顺序</h2>
          <div class="step-list">
            <div v-for="step in steps" :key="step.title" class="step-item">
              <span class="step-index">{{ step.index }}</span>
              <div>
                <strong>{{ step.title }}</strong>
                <p>{{ step.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <RuleFlowCanvas
        v-else-if="activeGraph"
        ref="flowCanvasRef"
        :title="activeCanvasTitle"
        :subtitle="activeCanvasSubtitle"
        :nodes="activeGraph.nodes"
        :edges="activeGraph.edges"
        :selected-node-id="selectedNodeId"
        :is-fullscreen="isFlowFullscreen"
        @update:nodes="updateNodes"
        @update:edges="updateEdges"
        @select-node="selectedNodeId = $event"
        @delete-selected="deleteSelectedNode"
        @auto-layout="autoLayout"
        @toggle-fullscreen="toggleFlowFullscreen"
      />
      <section v-else class="method-empty-state">
        <div>
          <h2>还没有可编辑的方法</h2>
          <p>先回到“基础与牌型”，在玩家、牌或牌桌下面添加一个方法，再进入这里构建方法流程。</p>
          <el-button type="primary" @click="activeWorkspace = 'structure'">去添加方法</el-button>
        </div>
      </section>

      <RulePropertyPanel
        v-if="activeWorkspace !== 'structure' && !showJson"
        :node="selectedNode"
        :design="design"
        :active-method="activeWorkspace === 'method' ? activeMethod : null"
        :active-cardset="activeWorkspace === 'cardset' ? activeCardset : null"
        :active-comparison="activeWorkspace === 'cardsetCompare' ? activeComparison : null"
        :object-pool="objectPool"
        :graph-nodes="activeGraph?.nodes || []"
        :graph-edges="activeGraph?.edges || []"
        @update-content="updateNodeContent"
        @update-method-return="updateActiveMethodReturn"
        @update-comparison-cardsets="updateActiveComparisonCardsets"
      />
      <RuleJsonPreview
        v-if="showJson"
        :json-text="jsonText"
        :validations="validations"
        @copy-json="copyJson"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import RuleComponentPalette from '../components/rule-builder/RuleComponentPalette.vue'
import RuleFlowCanvas from '../components/rule-builder/RuleFlowCanvas.vue'
import RuleJsonPreview from '../components/rule-builder/RuleJsonPreview.vue'
import RulePropertyPanel from '../components/rule-builder/RulePropertyPanel.vue'
import RuleStructurePanel from '../components/rule-builder/RuleStructurePanel.vue'
import { ruleApi } from '../api'
import type { RuleDraftStatus } from '../api/rule'
import type { ComponentTemplate, FlowGraphDraft, FlowScope, MethodDraft, RuleEdgeDraft, RuleNodeDraft } from '../types/ruleBuilder'
import {
  cloneContent,
  componentTemplates,
  createCardset,
  createCardsetComparison,
  createInitialDesign,
  createMethod,
  createMethodParameter,
  createNodeFromTemplate,
  createProperty,
  createRuleObjectPool,
  exportRuleDesign,
  importRuleDesign,
  validateRuleDesign,
} from '../utils/ruleBuilder'

type WorkspaceKey = 'structure' | 'method' | 'cardset' | 'cardsetCompare' | 'match' | 'settlement'

const route = useRoute()
const router = useRouter()
const design = reactive(createInitialDesign())
const draftId = ref<string | null>(null)
const draftStatus = ref<RuleDraftStatus>('draft')
const rejectReason = ref<string>('')
const submitting = ref(false)
const activeWorkspace = ref<WorkspaceKey>('structure')
const activeCardsetId = ref(design.cardsets[0].id)
const activeComparisonId = ref(design.cardsetComparisons[0]?.id || null)
const activeMethodClassName = ref<string | null>(null)
const activeMethodId = ref<string | null>(null)
const selectedNodeId = ref<string | null>(null)
const showJson = ref(false)
const showJsonImport = ref(false)
const jsonImportText = ref('')
const flowCanvasRef = ref<InstanceType<typeof RuleFlowCanvas> | null>(null)
const builderMainRef = ref<HTMLElement | null>(null)
const isFlowFullscreen = ref(false)

const workspaces: { key: WorkspaceKey; label: string }[] = [
  { key: 'structure', label: '基础与牌型' },
  { key: 'method', label: '方法流程' },
  { key: 'cardset', label: '牌型构建流程' },
  { key: 'cardsetCompare', label: '牌型比较流程' },
  { key: 'match', label: '对局流程' },
  { key: 'settlement', label: '结算流程' },
]

const steps = [
  { index: '01', title: '设定规则和固有类属性', description: '玩家、牌、牌桌的默认属性会进入导出的 classes 字段。' },
  { index: '02', title: '创建牌型和比较关系', description: '每个牌型比较流程只描述两种牌型的优先关系。' },
  { index: '03', title: '绘制流程图', description: '每张图固定一个开始节点，导出时它会成为编号 1。' },
  { index: '04', title: '检查并保存 JSON', description: '前端先完成基础校验，后端接口接入后直接提交报文。' },
]

const activeCardset = computed(() => {
  return design.cardsets.find(cardset => cardset.id === activeCardsetId.value) || design.cardsets[0]
})

const activeComparison = computed(() => {
  return design.cardsetComparisons.find(comparison => comparison.id === activeComparisonId.value) || design.cardsetComparisons[0] || null
})

const objectPool = computed(() => createRuleObjectPool(design))

const methodEntries = computed(() => {
  return Object.values(design.classes).flatMap(classDraft => {
    return classDraft.methods.map(method => ({
      className: classDraft.name,
      classDisplayName: classDraft.displayName,
      method,
    }))
  })
})

const activeMethodEntry = computed(() => {
  const selectedEntry = methodEntries.value.find(entry => {
    return entry.className === activeMethodClassName.value && entry.method.id === activeMethodId.value
  })

  return selectedEntry || methodEntries.value[0] || null
})

const activeMethod = computed<MethodDraft | null>(() => activeMethodEntry.value?.method || null)

const activeFlowScope = computed<FlowScope>(() => {
  if (activeWorkspace.value === 'settlement') {
    return 'settlement'
  }

  if (activeWorkspace.value === 'cardset') {
    return 'cardset'
  }

  if (activeWorkspace.value === 'cardsetCompare') {
    return 'cardsetCompare'
  }

  if (activeWorkspace.value === 'method') {
    return 'method'
  }

  return 'match'
})

const activeGraph = computed<FlowGraphDraft | null>(() => {
  if (activeWorkspace.value === 'settlement') {
    return design.endFlow
  }

  if (activeWorkspace.value === 'cardset') {
    return activeCardset.value.buildFlow
  }

  if (activeWorkspace.value === 'cardsetCompare') {
    return activeComparison.value?.compareFlow || null
  }

  if (activeWorkspace.value === 'method') {
    return activeMethod.value?.flow || null
  }

  return design.matchFlow
})

const activeCanvasTitle = computed(() => {
  if (activeWorkspace.value === 'cardset') {
    return `牌型构建：${activeCardset.value.name}`
  }

  if (activeWorkspace.value === 'cardsetCompare') {
    return `牌型比较：${getCardsetName(activeComparison.value?.cardsetA || '')}与${getCardsetName(activeComparison.value?.cardsetB || '')}`
  }

  if (activeWorkspace.value === 'method') {
    if (!activeMethodEntry.value) {
      return '方法流程'
    }

    return `方法流程：${activeMethodEntry.value.classDisplayName}.${activeMethodEntry.value.method.name}`
  }

  if (activeWorkspace.value === 'settlement') {
    return '结算流程'
  }

  return '对局流程'
})

const activeCanvasSubtitle = computed(() => {
  if (activeWorkspace.value === 'cardset') {
    return '使用初始牌组、逻辑组件和匹配返回组件描述该牌型是否成立'
  }

  if (activeWorkspace.value === 'cardsetCompare') {
    return '比较牌型 A 和牌型 B 的属性，并用比较返回组件给出优先级更高的一方'
  }

  if (activeWorkspace.value === 'method') {
    return '从方法开始节点出发，使用通用组件组合方法逻辑，并用方法返回组件结束'
  }

  if (activeWorkspace.value === 'settlement') {
    return '为每个玩家判断胜负，至少连接到一个结算结束组件'
  }

  return '从对局开始节点出发，连接洗牌、发牌、出牌、动作和结束节点'
})

const selectedNode = computed(() => {
  return activeGraph.value?.nodes.find(node => node.id === selectedNodeId.value) || null
})

const exportedDesign = computed(() => exportRuleDesign(design))
const jsonText = computed(() => JSON.stringify(exportedDesign.value, null, 2))
const validations = computed(() => validateRuleDesign(design))

const getCardsetName = (cardsetId: string) => {
  return design.cardsets.find(cardset => cardset.id === cardsetId)?.name || '未选择'
}

watch(activeWorkspace, () => {
  selectedNodeId.value = null

  if (activeWorkspace.value === 'method' && activeGraph.value) {
    activeGraph.value.nodes = syncSemanticInputs(activeGraph.value.nodes, activeGraph.value.edges)
  }
})

watch(activeCardsetId, () => {
  selectedNodeId.value = null
})

watch(activeComparisonId, () => {
  selectedNodeId.value = null
})

watch(activeMethodId, () => {
  if (activeWorkspace.value === 'method' && activeGraph.value) {
    activeGraph.value.nodes = syncSemanticInputs(activeGraph.value.nodes, activeGraph.value.edges)
  }
})

watch(
  () => activeMethod.value?.returns,
  () => {
    if (activeWorkspace.value !== 'method' || !activeGraph.value) {
      return
    }

    activeGraph.value.nodes = syncSemanticInputs(activeGraph.value.nodes, activeGraph.value.edges)
  },
)

onMounted(async () => {
  document.addEventListener('fullscreenchange', syncFullscreenState)
  await loadDraftFromRoute()
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
})

const getContentString = (content: Record<string, unknown>, field: string) => {
  const value = content[field]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

const syncSemanticInputs = (nodes: RuleNodeDraft[], edges: RuleEdgeDraft[]) => {
  return nodes.map(node => {
    if (node.data.content === null) {
      return node
    }

    const nextContent = cloneContent(node.data.content) || {}

    if (node.data.componentType === 5) {
      const indexEdge = edges.find(edge => edge.target === node.id && edge.targetHandle === 'index')
      nextContent.index = indexEdge?.source || ''
    }

    if (node.data.componentType === 4) {
      const componentEdge = edges.find(edge => edge.target === node.id && edge.targetHandle === 'component')
      const rvalueEdge = edges.find(edge => edge.target === node.id && edge.targetHandle === 'rvalue')
      nextContent.component = componentEdge?.source || ''
      nextContent.rvalue = rvalueEdge?.source || ''
    }

    if ([11, 13].includes(node.data.componentType)) {
      const componentEdge = edges.find(edge => edge.target === node.id && edge.targetHandle === 'component')
      nextContent.component = componentEdge?.source || ''
    }

    if ([10, 12, 14].includes(node.data.componentType)) {
      const lvalEdge = edges.find(edge => edge.target === node.id && edge.targetHandle === 'lval')
      const rvalEdge = edges.find(edge => edge.target === node.id && edge.targetHandle === 'rval')
      nextContent.lval = lvalEdge?.source || ''
      nextContent.rval = rvalEdge?.source || ''
    }

    if (node.data.componentType === 16) {
      const conditionEdge = edges.find(edge => edge.target === node.id && edge.targetHandle === 'condition')
      nextContent.condition = conditionEdge?.source || ''
    }

    if (node.data.componentType === 26) {
      const returnEdge = edges.find(edge => edge.target === node.id && edge.targetHandle === 'return')
      nextContent.return = activeMethod.value?.returns ? returnEdge?.source || '' : 'void'
    }

    if (
      getContentString(node.data.content, 'index') === getContentString(nextContent, 'index') &&
      getContentString(node.data.content, 'component') === getContentString(nextContent, 'component') &&
      getContentString(node.data.content, 'rvalue') === getContentString(nextContent, 'rvalue') &&
      getContentString(node.data.content, 'lval') === getContentString(nextContent, 'lval') &&
      getContentString(node.data.content, 'rval') === getContentString(nextContent, 'rval') &&
      getContentString(node.data.content, 'condition') === getContentString(nextContent, 'condition') &&
      getContentString(node.data.content, 'return') === getContentString(nextContent, 'return')
    ) {
      return node
    }

    return {
      ...node,
      data: {
        ...node.data,
        content: nextContent,
      },
    }
  })
}

const updateNodes = (nodes: RuleNodeDraft[]) => {
  if (!activeGraph.value) {
    return
  }

  const incomingIds = new Set(nodes.map(node => node.id))
  const preservedNodes = activeGraph.value.nodes.filter(node => !incomingIds.has(node.id))
  activeGraph.value.nodes = syncSemanticInputs([...nodes, ...preservedNodes], activeGraph.value.edges)
}

const updateEdges = (edges: FlowGraphDraft['edges']) => {
  if (!activeGraph.value) {
    return
  }

  activeGraph.value.edges = edges
  activeGraph.value.nodes = syncSemanticInputs(activeGraph.value.nodes, edges)
}

const addNode = (template: ComponentTemplate) => {
  if (!activeGraph.value) {
    ElMessage.warning('请先创建并选中一个方法')
    return
  }

  const center = flowCanvasRef.value?.getViewportCenter() || { x: 380, y: 260 }
  const node = createNodeFromTemplate(template, activeFlowScope.value, center.x - 95, center.y - 50)
  activeGraph.value.nodes = syncSemanticInputs([...activeGraph.value.nodes, node], activeGraph.value.edges)
  selectedNodeId.value = node.id
}

const updateNodeContent = (nodeId: string, content: Record<string, unknown> | null) => {
  if (!activeGraph.value) {
    return
  }

  activeGraph.value.nodes = activeGraph.value.nodes.map(node => {
    if (node.id !== nodeId) {
      return node
    }

    return {
      ...node,
      data: {
        ...node.data,
        content,
      },
    }
  })
}

const updateActiveMethodReturn = (returns: MethodDraft['returns']) => {
  if (!activeMethod.value) {
    return
  }

  activeMethod.value.returns = returns

  if (activeGraph.value) {
    activeGraph.value.nodes = syncSemanticInputs(activeGraph.value.nodes, activeGraph.value.edges)
  }
}

const deleteSelectedNode = () => {
  const node = selectedNode.value

  if (!activeGraph.value || !node || node.data.fixed) {
    return
  }

  const nextEdges = activeGraph.value.edges.filter(edge => edge.source !== node.id && edge.target !== node.id)
  const nextNodes = activeGraph.value.nodes.filter(item => item.id !== node.id)

  activeGraph.value.edges = nextEdges
  activeGraph.value.nodes = syncSemanticInputs(nextNodes, nextEdges)
  selectedNodeId.value = null
}

const autoLayout = () => {
  if (!activeGraph.value) {
    return
  }

  activeGraph.value.nodes = activeGraph.value.nodes.map((node, index) => ({
    ...node,
    position: {
      x: 80 + (index % 4) * 240,
      y: 160 + Math.floor(index / 4) * 160,
    },
  }))
}

const syncFullscreenState = () => {
  isFlowFullscreen.value = document.fullscreenElement === builderMainRef.value
}

const toggleFlowFullscreen = async () => {
  if (document.fullscreenElement === builderMainRef.value) {
    await document.exitFullscreen()
    return
  }

  if (!builderMainRef.value?.requestFullscreen) {
    ElMessage.warning('当前浏览器不支持全屏模式')
    return
  }

  showJson.value = false
  await builderMainRef.value.requestFullscreen()
}

const addCardset = () => {
  const nextId = Math.max(0, ...design.cardsets.map(cardset => Number(cardset.id) || 0)) + 1
  const cardset = createCardset(`牌型${nextId}`, nextId)
  design.cardsets.push(cardset)
  activeCardsetId.value = cardset.id
  activeWorkspace.value = 'cardset'
}

const removeCardset = (cardsetId: string) => {
  if (design.cardsets.length <= 1) {
    return
  }

  const index = design.cardsets.findIndex(cardset => cardset.id === cardsetId)

  if (index < 0) {
    return
  }

  design.cardsets.splice(index, 1)
  design.cardsets.forEach(cardset => {
    cardset.successors = cardset.successors.filter(successor => successor !== cardsetId)
  })
  design.cardsetComparisons.forEach(comparison => {
    if (comparison.cardsetA === cardsetId) {
      comparison.cardsetA = ''
    }

    if (comparison.cardsetB === cardsetId) {
      comparison.cardsetB = ''
    }

    syncComparisonStartNode(comparison)
  })
  activeCardsetId.value = design.cardsets[0].id
}

const syncComparisonStartNode = (comparison: NonNullable<typeof activeComparison.value>) => {
  comparison.compareFlow.nodes = comparison.compareFlow.nodes.map(node => {
    if (node.data.componentType !== 29) {
      return node
    }

    return {
      ...node,
      data: {
        ...node.data,
        content: {
          ...(node.data.content || {}),
          cardsetA: comparison.cardsetA,
          cardsetB: comparison.cardsetB,
        },
      },
    }
  })
}

const selectComparison = (comparisonId: string) => {
  const comparison = design.cardsetComparisons.find(item => item.id === comparisonId)
  const startNodeId = comparison?.compareFlow.nodes.find(node => node.data.componentType === 29)?.id || null

  activeComparisonId.value = comparisonId
  activeWorkspace.value = 'cardsetCompare'

  nextTick(() => {
    selectedNodeId.value = startNodeId
  })
}

const addCardsetComparison = () => {
  const nextId = Math.max(0, ...design.cardsetComparisons.map(comparison => Number(comparison.id) || 0)) + 1
  const firstCardset = design.cardsets[0]?.id || ''
  const secondCardset = design.cardsets.find(cardset => cardset.id !== firstCardset)?.id || ''
  const comparison = createCardsetComparison(nextId, firstCardset, secondCardset)
  syncComparisonStartNode(comparison)
  design.cardsetComparisons.push(comparison)
  selectComparison(comparison.id)
}

const removeCardsetComparison = (comparisonId: string) => {
  if (design.cardsetComparisons.length <= 1) {
    return
  }

  design.cardsetComparisons = design.cardsetComparisons.filter(comparison => comparison.id !== comparisonId)
  activeComparisonId.value = design.cardsetComparisons[0]?.id || null
}

const updateActiveComparisonCardsets = (cardsetA: string, cardsetB: string) => {
  if (!activeComparison.value) {
    return
  }

  activeComparison.value.cardsetA = cardsetA
  activeComparison.value.cardsetB = cardsetB
  syncComparisonStartNode(activeComparison.value)
}

const addCardsetProperty = (cardsetId: string) => {
  const cardset = design.cardsets.find(item => item.id === cardsetId)
  cardset?.properties.push(createProperty('新牌型属性'))
}

const removeCardsetProperty = (cardsetId: string, propertyId: string) => {
  const cardset = design.cardsets.find(item => item.id === cardsetId)

  if (cardset) {
    cardset.properties = cardset.properties.filter(property => property.id !== propertyId)
  }
}

const addClassProperty = (className: string, propertyType: 'default' | 'user') => {
  const classDraft = design.classes[className]

  if (!classDraft) {
    return
  }

  const target = propertyType === 'default' ? classDraft.defaultProperties : classDraft.userProperties
  target.push(createProperty('新属性'))
}

const removeClassProperty = (className: string, propertyType: 'default' | 'user', propertyId: string) => {
  const classDraft = design.classes[className]

  if (!classDraft) {
    return
  }

  if (propertyType === 'default') {
    classDraft.defaultProperties = classDraft.defaultProperties.filter(property => property.id !== propertyId)
    return
  }

  classDraft.userProperties = classDraft.userProperties.filter(property => property.id !== propertyId)
}

const selectMethod = (className: string, methodId: string) => {
  activeMethodClassName.value = className
  activeMethodId.value = methodId
  activeWorkspace.value = 'method'
}

const addMethod = (className: string) => {
  const classDraft = design.classes[className]

  if (!classDraft) {
    return
  }

  const method = createMethod(`方法${classDraft.methods.length + 1}`)
  classDraft.methods.push(method)
  selectMethod(className, method.id)
}

const removeMethod = (className: string, methodId: string) => {
  const classDraft = design.classes[className]

  if (!classDraft) {
    return
  }

  classDraft.methods = classDraft.methods.filter(method => method.id !== methodId)

  if (activeMethodClassName.value === className && activeMethodId.value === methodId) {
    const nextEntry = methodEntries.value[0]
    activeMethodClassName.value = nextEntry?.className || null
    activeMethodId.value = nextEntry?.method.id || null
  }
}

const addMethodParameter = (className: string, methodId: string) => {
  const method = design.classes[className]?.methods.find(item => item.id === methodId)

  if (!method) {
    return
  }

  method.parameters.push(createMethodParameter(`param${method.parameters.length + 1}`))
}

const removeMethodParameter = (className: string, methodId: string, parameterId: string) => {
  const method = design.classes[className]?.methods.find(item => item.id === methodId)

  if (!method) {
    return
  }

  method.parameters = method.parameters.filter(parameter => parameter.id !== parameterId)
}

const copyJson = async () => {
  await navigator.clipboard.writeText(jsonText.value)
  ElMessage.success('JSON 已复制')
}

const openJsonImport = () => {
  jsonImportText.value = jsonText.value
  showJsonImport.value = true
}

const importJsonToDesign = () => {
  try {
    const parsed = JSON.parse(jsonImportText.value)
    applyDesign(importRuleDesign(parsed, {
      name: design.info.name,
      playerCount: design.info.playerCount,
      description: design.info.description,
    }))
    showJsonImport.value = false
    showJson.value = false
    ElMessage.success('JSON 已生成对应组件模块')
  } catch {
    ElMessage.error('JSON 格式不正确，无法生成组件模块')
  }
}

const applyDesign = (nextDesign: ReturnType<typeof createInitialDesign>) => {
  Object.assign(design.info, nextDesign.info)
  design.classes = nextDesign.classes
  design.cardsets = nextDesign.cardsets
  design.cardsetComparisons = nextDesign.cardsetComparisons
  design.matchFlow = nextDesign.matchFlow
  design.endFlow = nextDesign.endFlow
  activeCardsetId.value = design.cardsets[0]?.id || ''
  activeComparisonId.value = design.cardsetComparisons[0]?.id || null
  activeMethodClassName.value = null
  activeMethodId.value = null
  selectedNodeId.value = null
}

const loadDraftFromRoute = async () => {
  const routeDraftId = typeof route.params.draftId === 'string' ? route.params.draftId : ''
  if (!routeDraftId) {
    draftId.value = null
    draftStatus.value = 'draft'
    rejectReason.value = ''
    return
  }

  if (routeDraftId === 'new') {
    draftId.value = null
    draftStatus.value = 'draft'
    rejectReason.value = ''
    return
  }

  const result = await ruleApi.getDraft(routeDraftId)
  if (!result.success || !result.data) {
    ElMessage.error(result.message || '规则草稿加载失败')
    await router.replace('/creation-center')
    return
  }

  draftId.value = result.data.id
  draftStatus.value = (result.data.status as RuleDraftStatus) || 'draft'
  rejectReason.value = result.data.rejectReason || ''
  applyDesign(importRuleDesign(result.data.design, {
    name: result.data.name,
    playerCount: result.data.playerCount,
    description: result.data.description,
  }))
}

const persistDraft = async (showError = true) => {
  const payload = {
    name: design.info.name,
    playerCount: design.info.playerCount,
    description: design.info.description,
    design: exportedDesign.value,
  }

  const result = draftId.value
    ? await ruleApi.updateDraft(draftId.value, payload)
    : await ruleApi.createDraft(payload)

  if (result.success && result.data?.id) {
    draftId.value = result.data.id
    return result.data.id
  }

  if (showError) {
    ElMessage.error(result.message || '规则草稿保存失败')
  }
  return ''
}

const validateBeforeSubmit = () => {
  const hasError = validations.value.some(item => item.level === 'error')

  if (hasError) {
    ElMessage.error('存在错误，请先修正后再保存')
    showJson.value = true
    return false
  }

  return true
}

const validateBeforePublish = () => {
  const runtimeValidations = validateRuleDesign(design, { strictRuntime: true })
  const hasError = runtimeValidations.some(item => item.level === 'error')

  if (hasError) {
    ElMessage.error('规则流程还不能运行，请先补全错误项')
    showJson.value = true
    return false
  }

  return true
}

const saveDesign = async () => {
  if (!validateBeforeSubmit()) {
    return
  }

  const savedDraftId = await persistDraft()
  if (savedDraftId) {
    ElMessage.success('规则草稿已保存')
    if (!route.params.draftId || route.params.draftId === 'new') {
      await router.replace(`/creation-center/${encodeURIComponent(savedDraftId)}`)
    }
  }
}

const uploadCompletedRule = async () => {
  if (draftStatus.value === 'pendingReview') {
    ElMessage.info('规则正在审核中，请等待审核员处理')
    return
  }

  if (!validateBeforeSubmit() || !validateBeforePublish()) {
    return
  }

  submitting.value = true
  const savedDraftId = await persistDraft()
  if (!savedDraftId) {
    submitting.value = false
    return
  }

  const result = await ruleApi.submitReview(savedDraftId)
  submitting.value = false

  if (result.success && result.data) {
    draftStatus.value = (result.data.status as RuleDraftStatus) || 'pendingReview'
    rejectReason.value = ''
    ElMessage.success('规则已提交审核，请等待审核员处理')
  } else {
    ElMessage.error(result.message || '规则提交审核失败')
  }
}

const publishButtonLabel = computed(() => {
  switch (draftStatus.value) {
    case 'pendingReview':
      return '审核中'
    case 'published':
      return '更新上架规则'
    case 'rejected':
      return '重新提交审核'
    default:
      return '提交审核'
  }
})

const publishButtonDisabled = computed(() => {
  return submitting.value || draftStatus.value === 'pendingReview'
})

const backToCenter = () => {
  void router.push('/creation-center')
}

const TUTORIAL_URL = 'https://buaa-iset.github.io/WildCard_Docs/tutorials/rule-builder-overview/'
const openTutorial = () => {
  window.open(TUTORIAL_URL, '_blank', 'noopener')
}
</script>

<style scoped>
.rule-builder-page {
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-height: 100%;
  height: calc(100vh - 64px);
  background: #f5f6fa;
  color: #252633;
  overflow: hidden;
  text-align: left;
}

.builder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 28px 16px;
  background: #fff;
  border-bottom: 1px solid #edf0f5;
}

.builder-header h1 {
  margin: 0;
  color: #252633;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0;
}

.builder-header p {
  margin: 6px 0 0;
  color: #3a4050;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  align-items: center;
}

.reject-reason-inline {
  color: #b42323;
  font-size: 12px;
  font-weight: 500;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 28px;
  border-bottom: 1px solid #dde1ea;
  background: #fff;
}

.workspace-tab {
  height: 38px;
  padding: 0 18px;
  border: 1px solid #d8dce5;
  border-radius: 8px;
  background: #fbfcfe;
  color: #2a3040;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.workspace-tab.active,
.workspace-tab:hover {
  border-color: #afa6e8;
  background: #f5f2ff;
}

.builder-main {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 340px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.builder-main.with-json {
  grid-template-columns: 280px minmax(0, 1fr) 390px;
}

.builder-main.structure-mode {
  grid-template-columns: 420px minmax(0, 1fr);
}

.builder-main.structure-mode.with-json {
  grid-template-columns: 420px minmax(0, 1fr) 390px;
}

.builder-main:fullscreen {
  width: 100vw;
  height: 100vh;
  grid-template-columns: 280px minmax(0, 1fr) 340px;
  background: #f5f6fa;
}

.builder-main.fullscreen-mode {
  grid-template-columns: 280px minmax(0, 1fr) 340px;
}

.structure-overview {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 28px;
}

.method-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  padding: 28px;
  background: #f8f9fc;
  text-align: center;
}

.method-empty-state > div {
  max-width: 420px;
  padding: 28px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.method-empty-state h2 {
  margin: 0 0 10px;
  color: #252633;
  font-size: 22px;
  font-weight: 700;
}

.method-empty-state p {
  margin: 0 0 18px;
  color: #3a4050;
  font-size: 14px;
  line-height: 1.7;
}

.overview-content {
  max-width: 920px;
  margin: 0 auto;
  padding: 28px;
  border: 1px solid #dfe3ec;
  border-radius: 8px;
  background: #fff;
}

.overview-content h2 {
  margin: 0 0 22px;
  color: #252633;
  font-size: 22px;
  font-weight: 700;
}

.step-list {
  display: grid;
  gap: 14px;
}

.step-item {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 14px;
  align-items: start;
  padding: 16px;
  border: 1px solid #e1e5ed;
  border-radius: 8px;
  background: #fbfcfe;
}

.step-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #ece8fb;
  color: #5849b6;
  font-weight: 700;
}

.step-item strong {
  color: #252633;
  font-size: 16px;
}

.step-item p {
  margin: 6px 0 0;
  color: #3a4050;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .builder-main,
  .builder-main.with-json,
  .builder-main.structure-mode,
  .builder-main.structure-mode.with-json {
    grid-template-columns: 260px minmax(0, 1fr);
  }

  .builder-main > :last-child {
    display: none;
  }

  .builder-main.fullscreen-mode,
  .builder-main.fullscreen-mode.with-json {
    grid-template-columns: 260px minmax(0, 1fr) 320px;
  }

  .builder-main.fullscreen-mode > :last-child {
    display: flex;
  }
}
</style>
