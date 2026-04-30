<template>
  <section class="canvas-panel">
    <div class="canvas-toolbar">
      <div>
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>
      <div class="toolbar-actions">
        <el-button size="small" @click="$emit('auto-layout')">整理布局</el-button>
        <el-button size="small" :disabled="!canDeleteSelected" @click="$emit('delete-selected')">删除节点</el-button>
        <el-button class="fullscreen-btn" size="small" @click="$emit('toggle-fullscreen')">
          <el-icon>
            <FullScreen v-if="!isFullscreen" />
            <Close v-else />
          </el-icon>
          <span>{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
        </el-button>
      </div>
    </div>
    <VueFlow
      id="rule-builder-flow"
      ref="flowWrapperRef"
      v-model:nodes="localNodes"
      v-model:edges="localEdges"
      class="rule-flow"
      :default-viewport="{ x: 80, y: 60, zoom: 0.9 }"
      :nodes-draggable="true"
      @init="focusStartNode"
      @connect="handleConnect"
      @node-click="handleNodeClick"
      @pane-click="$emit('select-node', null)"
    >
      <template #node-rule="nodeProps">
        <RuleFlowNode v-bind="nodeProps" />
      </template>
      <Background :gap="18" :size="1" color="#cfd4df" />
    </VueFlow>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Background } from '@vue-flow/background'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { Connection, Edge, Node, NodeMouseEvent } from '@vue-flow/core'
import RuleFlowNode from './RuleFlowNode.vue'
import { createId, edgeHasSameSourceHandle } from '../../utils/ruleBuilder'
import type { RuleEdgeDraft, RuleNodeDraft } from '../../types/ruleBuilder'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const props = defineProps<{
  title: string
  subtitle: string
  nodes: RuleNodeDraft[]
  edges: RuleEdgeDraft[]
  selectedNodeId: string | null
  isFullscreen: boolean
}>()

const emit = defineEmits<{
  (event: 'update:nodes', nodes: RuleNodeDraft[]): void
  (event: 'update:edges', edges: RuleEdgeDraft[]): void
  (event: 'select-node', nodeId: string | null): void
  (event: 'delete-selected'): void
  (event: 'auto-layout'): void
  (event: 'toggle-fullscreen'): void
}>()

const flowWrapperRef = ref<InstanceType<typeof VueFlow> | null>(null)
const { screenToFlowCoordinate, setCenter } = useVueFlow('rule-builder-flow')

const localNodes = computed<Node[]>({
  get: () => props.nodes as Node[],
  set: value => emit('update:nodes', value as RuleNodeDraft[]),
})

const localEdges = computed<Edge[]>({
  get: () => props.edges as Edge[],
  set: value => emit('update:edges', value as RuleEdgeDraft[]),
})

const canDeleteSelected = computed(() => {
  const selectedNode = props.nodes.find(node => node.id === props.selectedNodeId)
  return Boolean(selectedNode && !selectedNode.data.fixed)
})

const handleNodeClick = (event: NodeMouseEvent) => {
  emit('select-node', event.node.id)
}

const getViewportCenter = () => {
  const flowElement = flowWrapperRef.value?.$el as HTMLElement | undefined
  const rect = flowElement?.getBoundingClientRect()

  if (!rect) {
    return { x: 380, y: 260 }
  }

  return screenToFlowCoordinate({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  })
}

const focusStartNode = async () => {
  await nextTick()

  const startNode = props.nodes.find(node => node.data.fixed) || props.nodes[0]

  if (!startNode) {
    return
  }

  await setCenter(startNode.position.x + 95, startNode.position.y + 50, {
    zoom: 0.9,
    duration: 0,
  })
}

const handleConnect = (connection: Connection) => {
  if (!connection.source || !connection.target) {
    return
  }

  if (edgeHasSameSourceHandle(props.edges, connection.source, connection.sourceHandle)) {
    emit(
      'update:edges',
      props.edges.filter(edge => !(edge.source === connection.source && edge.sourceHandle === connection.sourceHandle)),
    )
  }

  const edge: RuleEdgeDraft = {
    id: createId('edge'),
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    label: connection.sourceHandle === 'true' ? '是' : connection.sourceHandle === 'false' ? '否' : undefined,
  }

  const edgesWithoutSameHandle = props.edges.filter(edgeItem => {
    return !(edgeItem.source === edge.source && (edgeItem.sourceHandle || null) === (edge.sourceHandle || null))
  })

  emit('update:edges', [...edgesWithoutSameHandle, edge])
}

watch(
  () => [props.title, props.nodes[0]?.id],
  () => {
    focusStartNode()
  },
  { flush: 'post' },
)

defineExpose({
  getViewportCenter,
  focusStartNode,
})
</script>

<style scoped>
.canvas-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: #f8f9fc;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 20px;
  border-bottom: 1px solid #dde1ea;
  background: #fff;
  text-align: left;
}

.canvas-toolbar h2 {
  margin: 0 0 4px;
  color: #252633;
  font-size: 19px;
  font-weight: 700;
}

.canvas-toolbar p {
  margin: 0;
  color: #737c8d;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.fullscreen-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rule-flow {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
