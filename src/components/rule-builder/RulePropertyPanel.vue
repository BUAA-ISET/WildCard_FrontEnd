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

        <template v-if="node.data.componentType === 2">
          <el-form-item label="集合来源">
            <el-select
              :model-value="getStringField('selection')"
              placeholder="选择当前视图中的属性访问组件"
              filterable
              @update:model-value="updateSortSelection"
            >
              <el-option
                v-for="component in propertyAccessComponentOptions"
                :key="component.value"
                :label="component.label"
                :value="component.value"
              />
            </el-select>
          </el-form-item>
          <div class="property-access-tip" :class="{ muted: !sortElementClass }">
            <template v-if="sortElementClass">
              已识别集合元素类型：{{ classDisplayNameMap[sortElementClass] }}。请选择排序依据属性，越靠上的属性优先级越高。
            </template>
            <template v-else>
              请选择指向集合的属性访问组件，目前可识别玩家池、卡牌池等集合属性。
            </template>
          </div>
          <section class="sort-property-list">
            <div class="deal-list-header">
              <span>排序属性</span>
              <el-button size="small" text :disabled="sortAvailableProperties.length === 0" @click="addSortProperty">添加属性</el-button>
            </div>
            <div v-if="sortProperties.length === 0" class="deal-empty">暂无排序属性</div>
            <div v-for="(property, index) in sortProperties" :key="`${index}-${property.name}`" class="sort-property-item">
              <el-select
                :model-value="property.name"
                placeholder="选择属性"
                :disabled="sortAvailableProperties.length === 0"
                filterable
                @update:model-value="updateSortProperty(index, 'name', $event)"
              >
                <el-option
                  v-for="option in sortAvailableProperties"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
              <el-select
                :model-value="property.order"
                placeholder="排序"
                @update:model-value="updateSortProperty(index, 'order', $event)"
              >
                <el-option label="升序" :value="1" />
                <el-option label="降序" :value="0" />
              </el-select>
              <el-button text type="danger" @click="removeSortProperty(index)">删除</el-button>
            </div>
          </section>
        </template>

        <template v-if="node.data.componentType === 4">
          <div class="assignment-summary" :class="{ filled: assignmentComponentNode }">
            <span>左值属性</span>
            <strong v-if="assignmentComponentNode">
              #{{ getNodeOrdinal(assignmentComponentNode) }} {{ assignmentComponentNode.data.title }}
            </strong>
            <strong v-else>等待连接属性访问组件</strong>
            <small v-if="assignmentProperty">
              属性：{{ assignmentProperty.name }} · 类型：{{ assignmentProperty.type === 'enum' ? '枚举量' : '整数' }}
            </small>
            <small v-else-if="assignmentComponentNode">暂时无法识别该属性访问组件的取值类型</small>
          </div>
          <div class="assignment-summary" :class="{ filled: assignmentRvalueNode }">
            <span>右值组件</span>
            <strong v-if="assignmentRvalueNode">
              #{{ getNodeOrdinal(assignmentRvalueNode) }} {{ assignmentRvalueNode.data.title }}
            </strong>
            <strong v-else>等待连接值组件或运算组件</strong>
          </div>
          <div class="property-access-tip">
            在画布中把属性访问组件连接到赋值节点的“左值属性”插槽，把值组件或运算组件连接到“右值”插槽，component 和 rvalue 会自动同步。
          </div>
        </template>

        <template v-if="node.data.componentType === 5">
          <el-form-item label="集合来源">
            <el-select
              :model-value="getStringField('selection')"
              placeholder="选择当前视图中的属性访问组件"
              filterable
              @update:model-value="updateCollectionAccessSelection"
            >
              <el-option
                v-for="component in propertyAccessComponentOptions"
                :key="component.value"
                :label="component.label"
                :value="component.value"
              />
            </el-select>
          </el-form-item>
          <div class="embedded-index-summary" :class="{ filled: selectedCollectionIndexNode }">
            <div>
              <span>下标组件</span>
              <strong v-if="selectedCollectionIndexNode">
                #{{ getNodeOrdinal(selectedCollectionIndexNode) }} {{ selectedCollectionIndexNode.data.title }}
              </strong>
              <strong v-else>等待嵌入值组件或运算组件</strong>
            </div>
            <el-input :model-value="getStringField('index')" disabled placeholder="连接下标插槽后自动填写" />
          </div>
          <div class="property-access-tip">
            在画布中把整数常量、属性访问、集合大小或算数运算等节点连接到集合访问节点底部的“下标插槽”，这里会自动同步 index。
          </div>
        </template>

        <template v-if="node.data.componentType === 7">
          <el-form-item label="集合来源">
            <el-select
              :model-value="getStringField('selection')"
              placeholder="选择当前视图中的属性访问组件"
              filterable
              @update:model-value="updateSelectionField"
            >
              <el-option
                v-for="component in propertyAccessComponentOptions"
                :key="component.value"
                :label="component.label"
                :value="component.value"
              />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 6">
          <el-form-item label="访问来源">
            <el-select
              :model-value="getNumberField('operator')"
              placeholder="先选择访问来源"
              @update:model-value="updatePropertyAccessOperator"
            >
              <el-option v-for="option in operatorOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>

          <template v-if="propertyAccessOperator === 0">
            <el-form-item label="对象">
              <el-select
                :model-value="getStringField('ident')"
                placeholder="选择对象后再选择属性"
                filterable
                @update:model-value="updatePropertyAccessIdent"
              >
                <el-option
                  v-for="object in availableObjects"
                  :key="object.id"
                  :label="`${object.name}（${classDisplayNameMap[object.className]}）`"
                  :value="object.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="属性">
              <el-select
                :model-value="getStringField('property')"
                placeholder="选择对象后可选属性"
                :disabled="!selectedPropertyAccessObject"
                filterable
                @update:model-value="updatePropertyAccessProperty"
              >
                <el-option
                  v-for="property in propertyAccessObjectProperties"
                  :key="property"
                  :label="property"
                  :value="property"
                />
              </el-select>
            </el-form-item>
          </template>

          <template v-else-if="propertyAccessOperator === 1">
            <el-form-item label="组件">
              <el-select
                :model-value="getStringField('ident')"
                placeholder="选择当前视图中的组件"
                filterable
                @update:model-value="updatePropertyAccessIdent"
              >
                <el-option
                  v-for="component in availableComponentOptions"
                  :key="component.value"
                  :label="component.label"
                  :value="component.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="属性">
              <el-select
                :model-value="getStringField('property')"
                placeholder="选择组件后可选属性"
                :disabled="!selectedPropertyAccessComponent"
                @update:model-value="updatePropertyAccessProperty"
              >
                <el-option label="type" value="type" />
                <el-option label="content" value="content" />
              </el-select>
            </el-form-item>
          </template>

          <template v-else>
            <div class="property-access-tip">
              <template v-if="incomingCollectionAccessNode">
                已连接集合访问组件：#{{ incomingCollectionAccessOrdinal }} {{ incomingCollectionAccessNode.data.title }}
              </template>
              <template v-else>
                请把一个集合访问组件连接到当前属性访问组件，系统会自动记录该集合访问组件编号。
              </template>
            </div>
            <el-form-item label="集合访问">
              <el-input :model-value="getStringField('ident')" disabled placeholder="连接集合访问组件后自动填写" />
            </el-form-item>
            <el-form-item label="属性">
              <el-select
                :model-value="getStringField('property')"
                placeholder="识别集合元素后可选属性"
                :disabled="!incomingCollectionAccessNode || propertyAccessCollectionProperties.length === 0"
                filterable
                @update:model-value="updatePropertyAccessProperty"
              >
                <el-option
                  v-for="property in propertyAccessCollectionProperties"
                  :key="property"
                  :label="property"
                  :value="property"
                />
              </el-select>
            </el-form-item>
            <div v-if="incomingCollectionAccessNode && propertyAccessCollectionProperties.length === 0" class="property-access-tip muted">
              暂时无法从该集合访问组件推断元素类型。后续完善集合访问组件后，这里会继续补齐。
            </div>
          </template>
        </template>

        <template v-if="node.data.componentType === 15">
          <el-form-item label="牌组">
            <el-select
              :model-value="selectedCardSetIds"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择组成牌组的牌"
              @update:model-value="updateCardJudgeSet"
            >
              <el-option
                v-for="card in objectPool.cards"
                :key="card.id"
                :label="getCardLabel(card)"
                :value="card.id"
              />
            </el-select>
          </el-form-item>
          <div class="property-access-tip">
            当前牌组已选择 {{ selectedCardSetIds.length }} 张牌，card_set 会按所选牌对象编号同步更新。
          </div>
          <el-form-item label="牌型">
            <el-select
              :model-value="getStringField('card_rule')"
              placeholder="选择已有牌型"
              filterable
              @update:model-value="updateCardJudgeRule"
            >
              <el-option
                v-for="cardset in design.cardsets"
                :key="cardset.id"
                :label="`${cardset.name}（#${cardset.id}）`"
                :value="cardset.id"
              />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 16">
          <el-form-item v-if="hasField('condition')" label="条件组件">
            <el-input :model-value="getStringField('condition')" @update:model-value="updateField('condition', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('component') && ![11, 13].includes(node.data.componentType)" label="组件引用">
            <el-input :model-value="getStringField('component')" @update:model-value="updateField('component', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('rvalue')" label="右值组件">
            <el-input :model-value="getStringField('rvalue')" @update:model-value="updateField('rvalue', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('lval') && ![10, 12, 14].includes(node.data.componentType)" label="左值">
            <el-input :model-value="getStringField('lval')" @update:model-value="updateField('lval', $event)" />
          </el-form-item>
          <el-form-item v-if="hasField('rval') && ![10, 12, 14].includes(node.data.componentType)" label="右值">
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
          <el-form-item v-if="hasField('operator')" label="运算符">
            <el-select :model-value="getNumberField('operator')" @update:model-value="updateField('operator', $event)">
              <el-option v-for="option in operatorOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 8">
          <el-form-item label="值">
            <el-input-number :model-value="getNumberField('value')" @update:model-value="updateField('value', $event || 0)" />
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 9">
          <div v-if="!enumAssignmentNode" class="property-access-tip">
            枚举常量需要连接到赋值组件的“右值”插槽，系统会根据赋值左侧属性决定可选枚举值。
          </div>
          <div v-else-if="!enumAssignmentProperty" class="property-access-tip muted">
            已连接赋值组件，但该赋值组件左侧还没有可识别的属性访问组件。
          </div>
          <div v-else-if="enumAssignmentProperty.type !== 'enum'" class="property-access-tip muted">
            当前赋值左侧属性是整数类型，不能使用枚举常量组件。
          </div>
          <el-form-item v-else :label="`${enumAssignmentProperty.name} 取值`">
            <el-select
              :model-value="getNumberField('value')"
              placeholder="选择枚举取值"
              @update:model-value="updateEnumConstantValue"
            >
              <el-option
                v-for="option in enumAssignmentOptions"
                :key="option.value"
                :label="option.display"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 10">
          <div class="operand-summary" :class="{ filled: arithmeticLvalNode }">
            <span>左操作数</span>
            <strong v-if="arithmeticLvalNode">
              #{{ getNodeOrdinal(arithmeticLvalNode) }} {{ arithmeticLvalNode.data.title }}
            </strong>
            <strong v-else>等待连接值组件或运算组件</strong>
          </div>
          <el-form-item label="算术运算">
            <el-select
              :model-value="getNumberField('operator')"
              placeholder="选择运算"
              @update:model-value="updateArithmeticOperator"
            >
              <el-option v-for="option in operatorOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <div class="operand-summary" :class="{ filled: arithmeticRvalNode }">
            <span>右操作数</span>
            <strong v-if="arithmeticRvalNode">
              #{{ getNodeOrdinal(arithmeticRvalNode) }} {{ arithmeticRvalNode.data.title }}
            </strong>
            <strong v-else>等待连接值组件或运算组件</strong>
          </div>
          <div class="property-access-tip">
            在画布中把值组件或运算组件连接到算术运算节点的“左操作数”和“右操作数”插槽，lval 和 rval 会自动同步。
          </div>
        </template>

        <template v-if="node.data.componentType === 11">
          <el-form-item label="逻辑操作">
            <el-select
              :model-value="getNumberField('operator')"
              placeholder="选择逻辑操作"
              @update:model-value="updateCollectionLogicOperator"
            >
              <el-option v-for="option in operatorOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="集合来源">
            <el-select
              :model-value="getStringField('set')"
              placeholder="选择当前视图中的属性访问组件"
              filterable
              @update:model-value="updateCollectionLogicSet"
            >
              <el-option
                v-for="component in propertyAccessComponentOptions"
                :key="component.value"
                :label="component.label"
                :value="component.value"
              />
            </el-select>
          </el-form-item>
          <div class="logic-component-summary" :class="{ filled: collectionLogicComponentNode }">
            <span>逻辑条件</span>
            <strong v-if="collectionLogicComponentNode">
              #{{ getNodeOrdinal(collectionLogicComponentNode) }} {{ collectionLogicComponentNode.data.title }}
            </strong>
            <strong v-else>等待连接逻辑组件</strong>
          </div>
          <div class="property-access-tip">
            在画布中把逻辑组件连接到集合逻辑节点的“逻辑条件”插槽，component 会自动同步。
          </div>
        </template>

        <template v-if="node.data.componentType === 13">
          <div class="logic-component-summary" :class="{ filled: unaryLogicComponentNode }">
            <span>逻辑条件</span>
            <strong v-if="unaryLogicComponentNode">
              #{{ getNodeOrdinal(unaryLogicComponentNode) }} {{ unaryLogicComponentNode.data.title }}
            </strong>
            <strong v-else>等待连接逻辑组件</strong>
          </div>
          <div class="property-access-tip">
            在画布中把逻辑组件连接到单目逻辑节点的“逻辑条件”插槽，component 会自动同步。
          </div>
        </template>

        <template v-if="node.data.componentType === 12">
          <div class="logic-component-summary" :class="{ filled: binaryLogicLvalNode }">
            <span>左逻辑</span>
            <strong v-if="binaryLogicLvalNode">
              #{{ getNodeOrdinal(binaryLogicLvalNode) }} {{ binaryLogicLvalNode.data.title }}
            </strong>
            <strong v-else>等待连接逻辑组件</strong>
          </div>
          <el-form-item label="逻辑操作">
            <el-select
              :model-value="getNumberField('operator')"
              placeholder="选择逻辑操作"
              @update:model-value="updateBinaryLogicOperator"
            >
              <el-option v-for="option in operatorOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <div class="logic-component-summary" :class="{ filled: binaryLogicRvalNode }">
            <span>右逻辑</span>
            <strong v-if="binaryLogicRvalNode">
              #{{ getNodeOrdinal(binaryLogicRvalNode) }} {{ binaryLogicRvalNode.data.title }}
            </strong>
            <strong v-else>等待连接逻辑组件</strong>
          </div>
          <div class="property-access-tip">
            在画布中把逻辑组件连接到双目逻辑节点的“左逻辑”和“右逻辑”插槽，lval 和 rval 会自动同步。
          </div>
        </template>

        <template v-if="node.data.componentType === 14">
          <div class="operand-summary" :class="{ filled: comparisonLvalNode }">
            <span>左操作数</span>
            <strong v-if="comparisonLvalNode">
              #{{ getNodeOrdinal(comparisonLvalNode) }} {{ comparisonLvalNode.data.title }}
            </strong>
            <strong v-else>等待连接值组件</strong>
          </div>
          <el-form-item label="比较操作">
            <el-select
              :model-value="getNumberField('operator')"
              placeholder="选择比较操作"
              @update:model-value="updateComparisonOperator"
            >
              <el-option v-for="option in operatorOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <div class="operand-summary" :class="{ filled: comparisonRvalNode }">
            <span>右操作数</span>
            <strong v-if="comparisonRvalNode">
              #{{ getNodeOrdinal(comparisonRvalNode) }} {{ comparisonRvalNode.data.title }}
            </strong>
            <strong v-else>等待连接值组件</strong>
          </div>
          <div class="property-access-tip">
            在画布中把值组件连接到比较节点的“左比较值”和“右比较值”插槽，lval 和 rval 会自动同步。
          </div>
        </template>

        <template v-if="node.data.componentType === 20">
          <el-form-item label="发牌数量">
            <el-input-number
              :model-value="getNumberField('count')"
              :min="1"
              controls-position="right"
              @update:model-value="updateDealCount"
            />
          </el-form-item>
          <section class="deal-property-list">
            <div class="deal-list-header">
              <span>牌属性组合</span>
              <el-button size="small" text @click="addDealPropPair">添加属性</el-button>
            </div>
            <div v-if="dealPropPairs.length === 0" class="deal-empty">暂未限制牌属性</div>
            <div v-for="(pair, index) in dealPropPairs" :key="index" class="deal-property-item">
              <el-form-item label="属性">
                <el-select
                  :model-value="pair.prop_name"
                  placeholder="选择牌属性"
                  filterable
                  @update:model-value="updateDealPropName(index, $event)"
                >
                  <el-option
                    v-for="property in cardProperties"
                    :key="property.id"
                    :label="property.name"
                    :value="property.name"
                  />
                </el-select>
              </el-form-item>
              <template v-if="getDealProperty(pair.prop_name)?.type === 'enum'">
                <div class="deal-range-row">
                  <el-form-item label="下界">
                    <el-select
                      :model-value="pair.lower_bound"
                      placeholder="选择下界"
                      @update:model-value="updateDealRange(index, 'lower_bound', $event)"
                    >
                      <el-option
                        v-for="option in getDealProperty(pair.prop_name)?.config || []"
                        :key="option.value"
                        :label="option.display"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="上界">
                    <el-select
                      :model-value="pair.upper_bound"
                      placeholder="选择上界"
                      @update:model-value="updateDealRange(index, 'upper_bound', $event)"
                    >
                      <el-option
                        v-for="option in getDealProperty(pair.prop_name)?.config || []"
                        :key="option.value"
                        :label="option.display"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>
                </div>
              </template>
              <template v-else>
                <div class="deal-range-row">
                  <el-form-item label="下界">
                    <el-input-number
                      :model-value="pair.lower_bound"
                      :min="getDealBounds(pair.prop_name).min"
                      :max="pair.upper_bound"
                      controls-position="right"
                      @update:model-value="updateDealRange(index, 'lower_bound', $event)"
                    />
                  </el-form-item>
                  <el-form-item label="上界">
                    <el-input-number
                      :model-value="pair.upper_bound"
                      :min="pair.lower_bound"
                      :max="getDealBounds(pair.prop_name).max"
                      controls-position="right"
                      @update:model-value="updateDealRange(index, 'upper_bound', $event)"
                    />
                  </el-form-item>
                </div>
              </template>
              <div class="deal-item-actions">
                <el-button size="small" text type="danger" @click="removeDealPropPair(index)">删除</el-button>
              </div>
            </div>
          </section>
        </template>

        <template v-if="[21, 22].includes(node.data.componentType)">
          <el-form-item label="时间限制">
            <el-input-number
              :model-value="getNumberField('timer')"
              :min="0"
              controls-position="right"
              @update:model-value="updateActionTimer"
            />
          </el-form-item>
          <section v-if="node.data.componentType === 22" class="action-option-list">
            <div class="deal-list-header">
              <span>动作枚举项</span>
              <el-button size="small" text @click="addActionOption">添加选项</el-button>
            </div>
            <div v-if="actionOptions.length === 0" class="deal-empty">暂无动作选项</div>
            <div v-for="(option, index) in actionOptions" :key="`${index}-${option.value}`" class="action-option-item">
              <el-input
                :model-value="option.name"
                placeholder="动作名称"
                @update:model-value="updateActionOption(index, 'name', $event)"
              />
              <el-input-number
                :model-value="option.value"
                controls-position="right"
                @update:model-value="updateActionOption(index, 'value', $event)"
              />
              <el-button text type="danger" @click="removeActionOption(index)">删除</el-button>
            </div>
          </section>
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
          <el-form-item label="返回类型">
            <el-select
              :model-value="activeMethodReturn"
              placeholder="选择返回类型"
              @update:model-value="updateMethodReturnType"
            >
              <el-option label="无返回值" value="void" />
              <el-option label="整数" value="int" />
              <el-option label="枚举" value="enum" />
            </el-select>
          </el-form-item>
          <div v-if="activeMethodReturn === 'void'" class="return-value-summary filled">
            <span>返回值</span>
            <strong>void</strong>
          </div>
          <template v-else>
            <div class="return-value-summary" :class="{ filled: methodReturnValueNode }">
              <span>返回值组件</span>
              <strong v-if="methodReturnValueNode">
                #{{ getNodeOrdinal(methodReturnValueNode) }} {{ methodReturnValueNode.data.title }}
              </strong>
              <strong v-else>等待连接值组件</strong>
            </div>
            <div class="property-access-tip">
              在画布中把值组件连接到方法返回节点的“返回值”插槽，return 会自动同步为该组件编号。
            </div>
          </template>
        </template>

        <template v-if="node.data.componentType === 28">
          <el-form-item label="匹配结果">
            <el-radio-group :model-value="getNumberField('result')" @update:model-value="updateMatchResult">
              <el-radio-button :value="1">成功</el-radio-button>
              <el-radio-button :value="0">失败</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <template v-if="getNumberField('result') === 1">
            <section class="match-property-list">
              <div class="match-list-header">牌型属性</div>
              <div v-if="matchProperties.length === 0" class="match-empty">当前牌型暂无可设置属性</div>
              <el-form-item
                v-for="property in matchProperties"
                :key="property.id"
                :label="property.name"
              >
                <el-select
                  v-if="property.type === 'enum'"
                  :model-value="getMatchPropertyValue(property)"
                  placeholder="选择枚举值"
                  @update:model-value="updateMatchProperty(property, $event)"
                >
                  <el-option
                    v-for="option in property.config || []"
                    :key="option.value"
                    :label="option.display"
                    :value="option.value"
                  />
                </el-select>
                <el-input-number
                  v-else
                  :model-value="getMatchPropertyValue(property)"
                  controls-position="right"
                  @update:model-value="updateMatchProperty(property, $event)"
                />
              </el-form-item>
            </section>
          </template>
          <div v-else class="property-access-tip muted">
            匹配失败时不会返回牌型属性。
          </div>
        </template>

        <template v-if="node.data.componentType === 29">
          <el-form-item label="比较牌型 A">
            <el-select
              :model-value="getStringField('cardsetA')"
              placeholder="选择牌型 A"
              filterable
              @update:model-value="updateCompareCardset('cardsetA', $event)"
            >
              <el-option
                v-for="cardset in design.cardsets"
                :key="cardset.id"
                :label="cardset.name"
                :value="cardset.id"
                :disabled="cardset.id === getStringField('cardsetB')"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="比较牌型 B">
            <el-select
              :model-value="getStringField('cardsetB')"
              placeholder="选择牌型 B"
              filterable
              @update:model-value="updateCompareCardset('cardsetB', $event)"
            >
              <el-option
                v-for="cardset in design.cardsets"
                :key="cardset.id"
                :label="cardset.name"
                :value="cardset.id"
                :disabled="cardset.id === getStringField('cardsetA')"
              />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="node.data.componentType === 30">
          <el-form-item label="优先级更高">
            <el-radio-group :model-value="getNumberField('result')" @update:model-value="updateCompareReturnResult">
              <el-radio-button :value="0">
                A：{{ getCardsetName(activeComparison?.cardsetA || '') }}
              </el-radio-button>
              <el-radio-button :value="1">
                B：{{ getCardsetName(activeComparison?.cardsetB || '') }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </template>
      </div>

      <div v-if="![1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 20, 22, 26, 28, 29, 30].includes(node.data.componentType)" class="raw-editor">
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
import { computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type {
  CardsetComparisonDraft,
  CardsetDraft,
  MethodDraft,
  PropertyDraft,
  RuleDesignDraft,
  RuleEdgeDraft,
  RuleNodeDraft,
  RuleObjectPool,
  RuleRuntimeObject,
} from '../../types/ruleBuilder'
import { CARD_INT_MAX, CARD_INT_MIN, cloneContent, getFlowOrdinalMap } from '../../utils/ruleBuilder'

interface DealPropPair {
  prop_name: string
  lower_bound: number
  upper_bound: number
}

interface ActionOptionDraft {
  name: string
  value: number
}

interface SortPropertyDraft {
  name: string
  order: number
}

const props = defineProps<{
  node: RuleNodeDraft | null
  design: RuleDesignDraft
  activeMethod: MethodDraft | null
  activeCardset: CardsetDraft | null
  activeComparison: CardsetComparisonDraft | null
  objectPool: RuleObjectPool
  graphNodes: RuleNodeDraft[]
  graphEdges: RuleEdgeDraft[]
}>()

const emit = defineEmits<{
  (event: 'update-content', nodeId: string, content: Record<string, unknown> | null): void
  (event: 'update-method-return', returns: MethodDraft['returns']): void
  (event: 'update-comparison-cardsets', cardsetA: string, cardsetB: string): void
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

const activeMethodReturn = computed(() => props.activeMethod?.returns || 'void')

const propertyAccessOperator = computed(() => getNumberField('operator'))

const flowOrdinalMap = computed(() => {
  return getFlowOrdinalMap({
    nodes: props.graphNodes,
    edges: props.graphEdges,
  })
})

const findNodeByOrdinalOrId = (ident: string) => {
  return props.graphNodes.find(node => node.id === ident || flowOrdinalMap.value[node.id] === ident) || null
}

const getPropertyNames = (properties: PropertyDraft[]) => {
  return properties.map(property => property.name).filter(Boolean)
}

const getClassProperties = (className: RuleRuntimeObject['className']) => {
  const classDraft = props.design.classes[className]
  return [...(classDraft?.defaultProperties || []), ...(classDraft?.userProperties || [])]
}

const getClassPropertyNames = (className: RuleRuntimeObject['className']) => {
  return getPropertyNames(getClassProperties(className))
}

const findClassProperty = (className: RuleRuntimeObject['className'], propertyName: string) => {
  return getClassProperties(className).find(property => property.name === propertyName) || null
}

const getRuntimeObjectPropertyNames = (object: RuleRuntimeObject | null) => {
  if (!object) {
    return []
  }

  return Array.from(new Set([...Object.keys(object.properties), ...getClassPropertyNames(object.className)]))
}

const selectedPropertyAccessObject = computed(() => {
  if (propertyAccessOperator.value !== 0) {
    return null
  }

  return availableObjects.value.find(object => object.id === getStringField('ident')) || null
})

const propertyAccessObjectProperties = computed(() => getRuntimeObjectPropertyNames(selectedPropertyAccessObject.value))

const availableComponentOptions = computed(() => {
  return props.graphNodes
    .filter(graphNode => graphNode.id !== props.node?.id)
    .map(graphNode => {
      return {
        label: `#${getNodeOrdinal(graphNode)} ${graphNode.data.title}（type ${graphNode.data.componentType}）`,
        value: getNodeOrdinal(graphNode),
      }
    })
    .filter(option => option.value)
})

const propertyAccessComponentOptions = computed(() => {
  return props.graphNodes
    .filter(graphNode => graphNode.id !== props.node?.id && graphNode.data.componentType === 6)
    .map(graphNode => ({
      label: `#${getNodeOrdinal(graphNode)} ${graphNode.data.title}`,
      value: getNodeOrdinal(graphNode),
    }))
    .filter(option => option.value)
})

const cardProperties = computed(() => getClassProperties('card'))
const matchProperties = computed(() => props.activeCardset?.properties || [])

const selectedCardSetIds = computed(() => {
  const cardSet = contentRecord.value.card_set

  if (Array.isArray(cardSet)) {
    return cardSet.map(item => String(item)).filter(Boolean)
  }

  if (typeof cardSet === 'string') {
    return cardSet.split('|').filter(Boolean)
  }

  return []
})

const getCardPropertyDisplayValue = (propertyName: string, value: unknown) => {
  const property = cardProperties.value.find(item => item.name === propertyName)

  if (property?.type === 'enum') {
    return property.config?.find(option => option.value === value)?.display || String(value)
  }

  return String(value)
}

const getCardLabel = (card: RuleRuntimeObject) => {
  const propertySummary = Object.entries(card.properties)
    .map(([propertyName, value]) => `${propertyName}:${getCardPropertyDisplayValue(propertyName, value)}`)
    .join('，')

  return propertySummary ? `${card.name}（${propertySummary}）` : card.name
}

const normalizeDealPair = (pair: unknown): DealPropPair => {
  const source = typeof pair === 'object' && pair !== null ? pair as Record<string, unknown> : {}
  const propName = typeof source.prop_name === 'string' ? source.prop_name : ''
  const bounds = getDealBounds(propName)
  const lowerBound = typeof source.lower_bound === 'number' ? source.lower_bound : bounds.min
  const upperBound = typeof source.upper_bound === 'number' ? source.upper_bound : bounds.max
  const normalizedLower = Math.max(bounds.min, Math.min(bounds.max, lowerBound))
  const normalizedUpper = Math.max(normalizedLower, Math.min(bounds.max, upperBound))

  return {
    prop_name: propName,
    lower_bound: normalizedLower,
    upper_bound: normalizedUpper,
  }
}

const dealPropPairs = computed(() => {
  const propPairs = contentRecord.value.prop_pair
  return Array.isArray(propPairs) ? propPairs.map(normalizeDealPair) : []
})

const normalizeActionOption = (option: unknown, index: number): ActionOptionDraft => {
  const source = typeof option === 'object' && option !== null ? option as Record<string, unknown> : {}
  const name = typeof source.name === 'string' ? source.name : `选项${index}`
  const value = typeof source.value === 'number' ? source.value : index
  return { name, value }
}

const actionOptions = computed(() => {
  const options = contentRecord.value.options
  return Array.isArray(options) ? options.map(normalizeActionOption) : []
})

const selectedPropertyAccessComponent = computed(() => {
  if (propertyAccessOperator.value !== 1) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('ident'))
})

const incomingCollectionAccessNode = computed(() => {
  if (!props.node || propertyAccessOperator.value !== 2) {
    return null
  }

  const incomingEdge = props.graphEdges.find(edge => {
    const sourceNode = props.graphNodes.find(graphNode => graphNode.id === edge.source)
    return edge.target === props.node?.id && sourceNode?.data.componentType === 5
  })

  if (!incomingEdge) {
    return null
  }

  return props.graphNodes.find(graphNode => graphNode.id === incomingEdge.source) || null
})

const incomingCollectionAccessOrdinal = computed(() => {
  if (!incomingCollectionAccessNode.value) {
    return ''
  }

  return flowOrdinalMap.value[incomingCollectionAccessNode.value.id] || ''
})

const getNodeStringContentField = (targetNode: RuleNodeDraft | null, field: string) => {
  const value = targetNode?.data.content?.[field]
  return typeof value === 'string' ? value : String(value || '')
}

const getRuntimeArrayElementClass = (value: unknown): RuleRuntimeObject['className'] | null => {
  if (!Array.isArray(value)) {
    return null
  }

  const firstObject = value.find(item => {
    return typeof item === 'object' && item !== null && 'className' in item
  }) as RuleRuntimeObject | undefined
  return firstObject?.className || null
}

const inferCollectionElementClassFromPropertyAccessNode = (propertyAccessNode: RuleNodeDraft | null) => {
  if (!propertyAccessNode || propertyAccessNode.data.componentType !== 6) {
    return null
  }

  const propertyName = getNodeStringContentField(propertyAccessNode, 'property')

  if (propertyName === '玩家池') {
    return 'player'
  }

  if (propertyName === '卡牌池') {
    return 'card'
  }

  const operator = Number(propertyAccessNode.data.content?.operator ?? 0)

  if (operator === 0) {
    const objectIdent = getNodeStringContentField(propertyAccessNode, 'ident')
    const object = availableObjects.value.find(item => item.id === objectIdent)
    return getRuntimeArrayElementClass(object?.properties[propertyName])
  }

  return null
}

const selectedSortSelectionNode = computed(() => {
  if (props.node?.data.componentType !== 2) {
    return null
  }

  const selectionIdent = getStringField('selection')
  return selectionIdent ? findNodeByOrdinalOrId(selectionIdent) : null
})

const sortElementClass = computed(() => inferCollectionElementClassFromPropertyAccessNode(selectedSortSelectionNode.value))

const sortAvailableProperties = computed(() => {
  return sortElementClass.value ? getClassPropertyNames(sortElementClass.value) : []
})

const normalizeSortProperty = (property: unknown): SortPropertyDraft => {
  const source = typeof property === 'object' && property !== null ? property as Record<string, unknown> : {}
  const name = typeof source.name === 'string' ? source.name : ''
  const order = typeof source.order === 'number' ? source.order : 1
  return {
    name,
    order: order === 0 ? 0 : 1,
  }
}

const sortProperties = computed(() => {
  const properties = contentRecord.value.properties
  return Array.isArray(properties) ? properties.map(normalizeSortProperty) : []
})

const inferCollectionElementClass = computed<RuleRuntimeObject['className'] | null>(() => {
  const collectionNode = incomingCollectionAccessNode.value
  const selectionIdent = getNodeStringContentField(collectionNode, 'selection')
  const selectionNode = selectionIdent ? findNodeByOrdinalOrId(selectionIdent) : null
  return inferCollectionElementClassFromPropertyAccessNode(selectionNode)
})

const propertyAccessCollectionProperties = computed(() => {
  const className = inferCollectionElementClass.value
  return className ? getClassPropertyNames(className) : []
})

const inferPropertyAccessCollectionClass = (propertyAccessNode: RuleNodeDraft) => {
  const collectionIdent = getNodeStringContentField(propertyAccessNode, 'ident')
  const collectionNode = collectionIdent ? findNodeByOrdinalOrId(collectionIdent) : null
  const selectionIdent = getNodeStringContentField(collectionNode, 'selection')
  const selectionNode = selectionIdent ? findNodeByOrdinalOrId(selectionIdent) : null

  if (collectionNode?.data.componentType !== 5 || selectionNode?.data.componentType !== 6) {
    return null
  }

  const selectedProperty = getNodeStringContentField(selectionNode, 'property')

  if (selectedProperty === '玩家池') {
    return 'player'
  }

  if (selectedProperty === '卡牌池') {
    return 'card'
  }

  return null
}

const resolvePropertyAccessProperty = (propertyAccessNode: RuleNodeDraft | null) => {
  if (!propertyAccessNode || propertyAccessNode.data.componentType !== 6) {
    return null
  }

  const content = propertyAccessNode.data.content || {}
  const operator = typeof content.operator === 'number' ? content.operator : 0
  const propertyName = getNodeStringContentField(propertyAccessNode, 'property')

  if (!propertyName) {
    return null
  }

  if (operator === 0) {
    const objectIdent = getNodeStringContentField(propertyAccessNode, 'ident')
    const object = availableObjects.value.find(item => item.id === objectIdent)
    return object ? findClassProperty(object.className, propertyName) : null
  }

  if (operator === 2) {
    const className = inferPropertyAccessCollectionClass(propertyAccessNode)
    return className ? findClassProperty(className, propertyName) : null
  }

  return null
}

const selectedCollectionIndexNode = computed(() => {
  if (props.node?.data.componentType !== 5) {
    return null
  }

  const indexIdent = getStringField('index')
  return indexIdent ? findNodeByOrdinalOrId(indexIdent) : null
})

const incomingIndexNode = computed(() => {
  if (props.node?.data.componentType !== 5) {
    return null
  }

  const incomingEdge = props.graphEdges.find(edge => edge.target === props.node?.id && edge.targetHandle === 'index')
  return incomingEdge ? props.graphNodes.find(graphNode => graphNode.id === incomingEdge.source) || null : null
})

const assignmentComponentNode = computed(() => {
  if (props.node?.data.componentType !== 4) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('component'))
})

const assignmentRvalueNode = computed(() => {
  if (props.node?.data.componentType !== 4) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('rvalue'))
})

const assignmentProperty = computed(() => resolvePropertyAccessProperty(assignmentComponentNode.value))

const enumAssignmentNode = computed(() => {
  if (props.node?.data.componentType !== 9) {
    return null
  }

  const edge = props.graphEdges.find(edgeItem => {
    const targetNode = props.graphNodes.find(graphNode => graphNode.id === edgeItem.target)
    return edgeItem.source === props.node?.id && edgeItem.targetHandle === 'rvalue' && targetNode?.data.componentType === 4
  })

  return edge ? props.graphNodes.find(graphNode => graphNode.id === edge.target) || null : null
})

const enumAssignmentProperty = computed(() => {
  const assignmentNode = enumAssignmentNode.value

  if (!assignmentNode) {
    return null
  }

  const componentIdent = getNodeStringContentField(assignmentNode, 'component')
  return resolvePropertyAccessProperty(findNodeByOrdinalOrId(componentIdent))
})

const enumAssignmentOptions = computed(() => enumAssignmentProperty.value?.config || [])

const arithmeticLvalNode = computed(() => {
  if (props.node?.data.componentType !== 10) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('lval'))
})

const arithmeticRvalNode = computed(() => {
  if (props.node?.data.componentType !== 10) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('rval'))
})

const collectionLogicComponentNode = computed(() => {
  if (props.node?.data.componentType !== 11) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('component'))
})

const unaryLogicComponentNode = computed(() => {
  if (props.node?.data.componentType !== 13) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('component'))
})

const binaryLogicLvalNode = computed(() => {
  if (props.node?.data.componentType !== 12) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('lval'))
})

const binaryLogicRvalNode = computed(() => {
  if (props.node?.data.componentType !== 12) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('rval'))
})

const comparisonLvalNode = computed(() => {
  if (props.node?.data.componentType !== 14) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('lval'))
})

const comparisonRvalNode = computed(() => {
  if (props.node?.data.componentType !== 14) {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('rval'))
})

const methodReturnValueNode = computed(() => {
  if (props.node?.data.componentType !== 26 || activeMethodReturn.value === 'void') {
    return null
  }

  return findNodeByOrdinalOrId(getStringField('return'))
})

const hasField = (field: string) => Object.prototype.hasOwnProperty.call(contentRecord.value, field)

const getNodeOrdinal = (targetNode: RuleNodeDraft) => flowOrdinalMap.value[targetNode.id] || ''

const getStringField = (field: string) => {
  const value = contentRecord.value[field]
  return typeof value === 'string' ? value : String(value || '')
}

const getNumberField = (field: string) => {
  const value = contentRecord.value[field]
  return typeof value === 'number' ? value : 0
}

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

const updatePropertyAccessOperator = (value: string | number) => {
  const operator = Number(value)
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.operator = Number.isNaN(operator) ? 0 : operator
  nextContent.ident = nextContent.operator === 2 ? incomingCollectionAccessOrdinal.value : ''
  nextContent.property = ''
  emitContent(nextContent)
}

const updatePropertyAccessIdent = (value: string | number) => {
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.ident = String(value)
  nextContent.property = ''
  emitContent(nextContent)
}

const updatePropertyAccessProperty = (value: string | number) => {
  updateField('property', String(value))
}

const emitSortProperties = (properties: SortPropertyDraft[]) => {
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.properties = properties
  emitContent(nextContent)
}

const normalizeSortPropertiesByClass = (
  properties: SortPropertyDraft[],
  className: RuleRuntimeObject['className'] | null,
) => {
  const availableProperties = className ? getClassPropertyNames(className) : []

  if (availableProperties.length === 0) {
    return []
  }

  const normalizedProperties = properties
    .filter(property => availableProperties.includes(property.name))
    .map(property => ({
      name: property.name,
      order: property.order === 0 ? 0 : 1,
    }))

  return normalizedProperties.length > 0
    ? normalizedProperties
    : [{ name: availableProperties[0], order: 1 }]
}

const updateSortSelection = (value: string | number) => {
  const selection = String(value)
  const selectionNode = findNodeByOrdinalOrId(selection)
  const className = inferCollectionElementClassFromPropertyAccessNode(selectionNode)
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.selection = selection
  nextContent.properties = normalizeSortPropertiesByClass(sortProperties.value, className)
  emitContent(nextContent)
}

const addSortProperty = () => {
  const usedProperties = new Set(sortProperties.value.map(property => property.name))
  const propertyName = sortAvailableProperties.value.find(property => !usedProperties.has(property)) || sortAvailableProperties.value[0]

  if (!propertyName) {
    return
  }

  emitSortProperties([...sortProperties.value, { name: propertyName, order: 1 }])
}

const removeSortProperty = (index: number) => {
  emitSortProperties(sortProperties.value.filter((_, propertyIndex) => propertyIndex !== index))
}

const updateSortProperty = (
  index: number,
  field: keyof SortPropertyDraft,
  value: string | number,
) => {
  const nextProperties = sortProperties.value.map((property, propertyIndex) => {
    if (propertyIndex !== index) {
      return property
    }

    if (field === 'order') {
      const order = Number(value)
      return {
        ...property,
        order: order === 0 ? 0 : 1,
      }
    }

    return {
      ...property,
      name: String(value),
    }
  })

  emitSortProperties(nextProperties)
}

const updateCollectionAccessSelection = (value: string | number) => {
  updateField('selection', String(value))
}

const updateSelectionField = (value: string | number) => {
  updateField('selection', String(value))
}

const updateEnumConstantValue = (value: string | number) => {
  updateField('value', Number(value))
}

const updateArithmeticOperator = (value: string | number) => {
  updateField('operator', Number(value))
}

const updateCollectionLogicOperator = (value: string | number) => {
  updateField('operator', Number(value))
}

const updateCollectionLogicSet = (value: string | number) => {
  updateField('set', String(value))
}

const updateBinaryLogicOperator = (value: string | number) => {
  updateField('operator', Number(value))
}

const updateComparisonOperator = (value: string | number) => {
  updateField('operator', Number(value))
}

const updateMethodReturnType = (value: string | number) => {
  const returns = value === 'int' || value === 'enum' ? value : null
  emit('update-method-return', returns)
}

const getDealProperty = (propertyName: string) => {
  return cardProperties.value.find(property => property.name === propertyName) || null
}

const getDealBounds = (propertyName: string) => {
  const property = getDealProperty(propertyName)

  if (property?.type === 'enum') {
    const values = (property.config || []).map(option => option.value)
    const fallback = property.default
    return {
      min: values.length > 0 ? Math.min(...values) : fallback,
      max: values.length > 0 ? Math.max(...values) : fallback,
    }
  }

  if (property?.type === 'int') {
    const lowerBound = property.lowerBound ?? property.default
    const upperBound = property.upperBound ?? property.default
    const min = Math.max(CARD_INT_MIN, Math.min(CARD_INT_MAX, lowerBound))
    const max = Math.max(min, Math.min(CARD_INT_MAX, upperBound))
    return { min, max }
  }

  return { min: CARD_INT_MIN, max: CARD_INT_MAX }
}

const emitDealPairs = (pairs: DealPropPair[]) => {
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.prop_pair = pairs
  emitContent(nextContent)
}

const createDealPair = (propertyName: string): DealPropPair => {
  const bounds = getDealBounds(propertyName)
  return {
    prop_name: propertyName,
    lower_bound: bounds.min,
    upper_bound: bounds.max,
  }
}

const addDealPropPair = () => {
  const usedPropertyNames = new Set(dealPropPairs.value.map(pair => pair.prop_name))
  const property = cardProperties.value.find(item => !usedPropertyNames.has(item.name)) || cardProperties.value[0]

  if (!property) {
    return
  }

  emitDealPairs([...dealPropPairs.value, createDealPair(property.name)])
}

const removeDealPropPair = (index: number) => {
  emitDealPairs(dealPropPairs.value.filter((_, pairIndex) => pairIndex !== index))
}

const updateDealPropName = (index: number, propertyName: string | number) => {
  const nextPairs = dealPropPairs.value.map((pair, pairIndex) => {
    if (pairIndex !== index) {
      return pair
    }

    return createDealPair(String(propertyName))
  })

  emitDealPairs(nextPairs)
}

const updateDealRange = (index: number, field: 'lower_bound' | 'upper_bound', value: string | number | null | undefined) => {
  const nextPairs = dealPropPairs.value.map((pair, pairIndex) => {
    if (pairIndex !== index) {
      return pair
    }

    const bounds = getDealBounds(pair.prop_name)
    const numericValue = typeof value === 'number' ? value : Number(value)
    const nextValue = Number.isNaN(numericValue) ? bounds.min : numericValue
    const nextPair = { ...pair, [field]: Math.max(bounds.min, Math.min(bounds.max, nextValue)) }

    if (nextPair.lower_bound > nextPair.upper_bound) {
      if (field === 'lower_bound') {
        nextPair.upper_bound = nextPair.lower_bound
      } else {
        nextPair.lower_bound = nextPair.upper_bound
      }
    }

    return nextPair
  })

  emitDealPairs(nextPairs)
}

const updateDealCount = (value: string | number | null | undefined) => {
  const count = typeof value === 'number' ? value : Number(value)
  updateField('count', Number.isNaN(count) ? 1 : Math.max(1, count))
}

const updateCardJudgeSet = (values: string[] | number[] | string | number) => {
  const cardIds = Array.isArray(values) ? values.map(value => String(value)) : [String(values)]
  updateField('card_set', cardIds.filter(Boolean).join('|'))
}

const updateCardJudgeRule = (value: string | number) => {
  updateField('card_rule', String(value))
}

const updateActionTimer = (value: string | number | null | undefined) => {
  const timer = typeof value === 'number' ? value : Number(value)
  updateField('timer', Number.isNaN(timer) ? 0 : Math.max(0, timer))
}

const emitActionOptions = (options: ActionOptionDraft[]) => {
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.options = options
  emitContent(nextContent)
}

const addActionOption = () => {
  const nextValue = Math.max(-1, ...actionOptions.value.map(option => option.value)) + 1
  emitActionOptions([
    ...actionOptions.value,
    {
      name: `选项${nextValue}`,
      value: nextValue,
    },
  ])
}

const removeActionOption = (index: number) => {
  emitActionOptions(actionOptions.value.filter((_, optionIndex) => optionIndex !== index))
}

const updateActionOption = (
  index: number,
  field: keyof ActionOptionDraft,
  value: string | number | null | undefined,
) => {
  const nextOptions = actionOptions.value.map((option, optionIndex) => {
    if (optionIndex !== index) {
      return option
    }

    if (field === 'value') {
      const numericValue = typeof value === 'number' ? value : Number(value)
      return {
        ...option,
        value: Number.isNaN(numericValue) ? option.value : numericValue,
      }
    }

    return {
      ...option,
      name: String(value || ''),
    }
  })

  emitActionOptions(nextOptions)
}

const getMatchPropertyMap = () => {
  const properties = contentRecord.value.properties
  return typeof properties === 'object' && properties !== null && !Array.isArray(properties)
    ? properties as Record<string, unknown>
    : {}
}

const getMatchPropertyValue = (property: PropertyDraft) => {
  const value = getMatchPropertyMap()[property.name]
  return typeof value === 'number' ? value : property.default
}

const updateMatchResult = (value: string | number) => {
  const result = Number(value)
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.result = result

  if (result === 1) {
    const currentProperties = getMatchPropertyMap()
    nextContent.properties = Object.fromEntries(
      matchProperties.value.map(property => [
        property.name,
        typeof currentProperties[property.name] === 'number' ? currentProperties[property.name] : property.default,
      ]),
    )
  } else {
    nextContent.properties = {}
  }

  emitContent(nextContent)
}

const updateMatchProperty = (property: PropertyDraft, value: string | number | null | undefined) => {
  const numericValue = typeof value === 'number' ? value : Number(value)
  const nextProperties = {
    ...getMatchPropertyMap(),
    [property.name]: Number.isNaN(numericValue) ? property.default : numericValue,
  }
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent.result = 1
  nextContent.properties = nextProperties
  emitContent(nextContent)
}

const getCardsetName = (cardsetId: string) => {
  return props.design.cardsets.find(cardset => cardset.id === cardsetId)?.name || '未选择'
}

const updateCompareCardset = (field: 'cardsetA' | 'cardsetB', value: string | number) => {
  const nextContent = cloneContent(props.node?.data.content || {}) || {}
  nextContent[field] = String(value)

  const cardsetA = typeof nextContent.cardsetA === 'string' ? nextContent.cardsetA : ''
  const cardsetB = typeof nextContent.cardsetB === 'string' ? nextContent.cardsetB : ''

  emitContent(nextContent)
  emit('update-comparison-cardsets', cardsetA, cardsetB)
}

const updateCompareReturnResult = (value: string | number) => {
  updateField('result', Number(value))
}

const parameterLabel = (index: number) => {
  const labels = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return `参数${labels[index] || index + 1}`
}

watch(
  () => [propertyAccessOperator.value, incomingCollectionAccessOrdinal.value, props.node?.id],
  ([operator, collectionOrdinal]) => {
    if (operator !== 2 || !collectionOrdinal || getStringField('ident') === collectionOrdinal) {
      return
    }

    updateField('ident', collectionOrdinal)
  },
)

watch(
  () => [incomingIndexNode.value?.id, props.node?.id],
  () => {
    if (props.node?.data.componentType !== 5 || !incomingIndexNode.value) {
      return
    }

    const nextIndex = getNodeOrdinal(incomingIndexNode.value)

    if (nextIndex && getStringField('index') !== nextIndex) {
      updateField('index', nextIndex)
    }
  },
)

watch(
  () => [props.node?.id, ...enumAssignmentOptions.value.map(option => option.value)],
  () => {
    if (props.node?.data.componentType !== 9 || enumAssignmentOptions.value.length === 0) {
      return
    }

    const currentValue = getNumberField('value')
    const hasCurrentValue = enumAssignmentOptions.value.some(option => option.value === currentValue)

    if (!hasCurrentValue) {
      updateField('value', enumAssignmentOptions.value[0].value)
    }
  },
)

watch(
  () => [props.node?.id, activeMethodReturn.value],
  () => {
    if (props.node?.data.componentType !== 26) {
      return
    }

    if (activeMethodReturn.value === 'void' && getStringField('return') !== 'void') {
      updateField('return', 'void')
    }
  },
)

watch(
  () => [props.node?.id, getNumberField('result'), ...matchProperties.value.map(property => `${property.name}:${property.default}`)],
  () => {
    if (props.node?.data.componentType !== 28 || getNumberField('result') !== 1) {
      return
    }

    const currentProperties = getMatchPropertyMap()
    const nextProperties = Object.fromEntries(
      matchProperties.value.map(property => [
        property.name,
        typeof currentProperties[property.name] === 'number' ? currentProperties[property.name] : property.default,
      ]),
    )

    if (JSON.stringify(currentProperties) !== JSON.stringify(nextProperties)) {
      updateField('properties', nextProperties)
    }
  },
)

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

.property-access-tip {
  margin: 0 0 14px;
  padding: 10px 12px;
  border: 1px solid #d8e2f2;
  border-radius: 8px;
  background: #f5f8fd;
  color: #4d5a6d;
  font-size: 13px;
  line-height: 1.6;
}

.property-access-tip.muted {
  border-color: #e4e7ed;
  background: #fafafa;
  color: #7a8290;
}

.embedded-index-summary {
  margin-bottom: 14px;
  padding: 12px;
  border: 1px dashed #c3cad8;
  border-radius: 8px;
  background: #f8f9fc;
}

.embedded-index-summary.filled {
  border-style: solid;
  border-color: #8b95d6;
  background: #f4f6ff;
}

.embedded-index-summary > div {
  margin-bottom: 10px;
}

.embedded-index-summary span {
  display: block;
  margin-bottom: 4px;
  color: #697386;
  font-size: 12px;
}

.embedded-index-summary strong {
  color: #252633;
  font-size: 14px;
  font-weight: 700;
}

.assignment-summary {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px dashed #c3cad8;
  border-radius: 8px;
  background: #f8f9fc;
}

.assignment-summary.filled {
  border-style: solid;
  border-color: #8cb89e;
  background: #f4faf6;
}

.assignment-summary span,
.assignment-summary small {
  display: block;
  color: #697386;
  font-size: 12px;
}

.assignment-summary strong {
  display: block;
  margin: 4px 0;
  color: #252633;
  font-size: 14px;
  font-weight: 700;
}

.operand-summary {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px dashed #c3cad8;
  border-radius: 8px;
  background: #f8f9fc;
}

.operand-summary.filled {
  border-style: solid;
  border-color: #c49b6c;
  background: #fff8f1;
}

.operand-summary span {
  display: block;
  margin-bottom: 4px;
  color: #697386;
  font-size: 12px;
}

.operand-summary strong {
  color: #252633;
  font-size: 14px;
  font-weight: 700;
}

.logic-component-summary {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px dashed #c3cad8;
  border-radius: 8px;
  background: #f8f9fc;
}

.logic-component-summary.filled {
  border-style: solid;
  border-color: #ca84a6;
  background: #fff5fa;
}

.logic-component-summary span {
  display: block;
  margin-bottom: 4px;
  color: #697386;
  font-size: 12px;
}

.logic-component-summary strong {
  color: #252633;
  font-size: 14px;
  font-weight: 700;
}

.return-value-summary {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px dashed #c3cad8;
  border-radius: 8px;
  background: #f8f9fc;
}

.return-value-summary.filled {
  border-style: solid;
  border-color: #8e9be3;
  background: #f4f6ff;
}

.return-value-summary span {
  display: block;
  margin-bottom: 4px;
  color: #697386;
  font-size: 12px;
}

.return-value-summary strong {
  color: #252633;
  font-size: 14px;
  font-weight: 700;
}

.deal-property-list {
  margin-top: 4px;
}

.deal-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: #4b5363;
  font-size: 13px;
  font-weight: 700;
}

.deal-empty {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px dashed #c3cad8;
  border-radius: 8px;
  background: #f8f9fc;
  color: #697386;
  font-size: 13px;
}

.deal-property-item {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e2e5ec;
  border-radius: 8px;
  background: #f8f9fc;
}

.deal-range-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.deal-range-row :deep(.el-form-item) {
  margin-bottom: 8px;
}

.deal-range-row :deep(.el-input-number),
.deal-range-row :deep(.el-select) {
  width: 100%;
}

.deal-item-actions {
  display: flex;
  justify-content: flex-end;
}

.action-option-list {
  margin-top: 4px;
}

.sort-property-list {
  margin-top: 4px;
}

.sort-property-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px 42px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  padding: 10px;
  border: 1px solid #e2e5ec;
  border-radius: 8px;
  background: #f8f9fc;
}

.sort-property-item :deep(.el-select) {
  width: 100%;
  min-width: 0;
}

.sort-property-item :deep(.el-button) {
  min-width: 0;
  padding: 0;
}

.action-option-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px 42px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  padding: 10px;
  border: 1px solid #e2e5ec;
  border-radius: 8px;
  background: #f8f9fc;
}

.action-option-item :deep(.el-input),
.action-option-item :deep(.el-input-number) {
  width: 100%;
  min-width: 0;
}

.action-option-item :deep(.el-button) {
  min-width: 0;
  padding: 0;
}

.match-property-list {
  margin-top: 4px;
}

.match-list-header {
  margin-bottom: 10px;
  color: #4b5363;
  font-size: 13px;
  font-weight: 700;
}

.match-empty {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px dashed #c3cad8;
  border-radius: 8px;
  background: #f8f9fc;
  color: #697386;
  font-size: 13px;
}

.match-property-list :deep(.el-input-number),
.match-property-list :deep(.el-select) {
  width: 100%;
}

.comparison-summary {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px dashed #c3cad8;
  border-radius: 8px;
  background: #f8f9fc;
}

.comparison-summary.filled {
  border-style: solid;
  border-color: #ca84a6;
  background: #fff5fa;
}

.comparison-summary span {
  display: block;
  margin-bottom: 4px;
  color: #697386;
  font-size: 12px;
}

.comparison-summary strong {
  color: #252633;
  font-size: 14px;
  font-weight: 700;
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
