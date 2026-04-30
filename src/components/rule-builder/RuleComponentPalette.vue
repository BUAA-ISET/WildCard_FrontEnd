<template>
  <aside class="palette-panel">
    <div class="panel-header">
      <div>
        <h2>组件库</h2>
        <p>点击组件即可加入当前画布</p>
      </div>
    </div>
    <div class="template-groups">
      <section v-for="group in groupedTemplates" :key="group.category" class="template-group">
        <div class="group-title">{{ group.label }}</div>
        <button
          v-for="template in group.templates"
          :key="template.componentType"
          class="template-item"
          type="button"
          @click="$emit('add-node', template)"
        >
          <span class="template-name">{{ template.title }}</span>
          <span class="template-type">type {{ template.componentType }}</span>
          <span class="template-desc">{{ template.description }}</span>
        </button>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentTemplate, FlowScope, NodeCategory } from '../../types/ruleBuilder'

const props = defineProps<{
  scope: FlowScope
  templates: ComponentTemplate[]
}>()

defineEmits<{
  (event: 'add-node', template: ComponentTemplate): void
}>()

const groupLabels: Record<NodeCategory, string> = {
  control: '控制流',
  action: '用户操作',
  execute: '执行',
  value: '值组件',
  logic: '逻辑',
  operation: '运算',
}

const groupedTemplates = computed(() => {
  const usableTemplates = props.templates.filter(template => template.scopes.includes(props.scope))
  const groups = Object.keys(groupLabels).map(category => ({
    category,
    label: groupLabels[category as NodeCategory],
    templates: usableTemplates.filter(template => template.category === category),
  }))

  return groups.filter(group => group.templates.length > 0)
})
</script>

<style scoped>
.palette-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #dde1ea;
  background: #fff;
}

.panel-header {
  padding: 18px 18px 14px;
  border-bottom: 1px solid #edf0f5;
  text-align: left;
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

.template-groups {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
}

.template-group + .template-group {
  margin-top: 16px;
}

.group-title {
  margin-bottom: 8px;
  color: #4a5160;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
}

.template-item {
  width: 100%;
  min-height: 76px;
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid #d8dce5;
  border-radius: 8px;
  background: #fbfcfe;
  color: #2e3340;
  cursor: pointer;
  text-align: left;
}

.template-item:hover {
  border-color: #afa6e8;
  background: #f5f2ff;
}

.template-name {
  display: inline-block;
  margin-right: 8px;
  font-size: 15px;
  font-weight: 700;
}

.template-type {
  color: #7b8495;
  font-size: 12px;
}

.template-desc {
  display: block;
  margin-top: 6px;
  color: #70798a;
  font-size: 12px;
  line-height: 1.4;
}
</style>
