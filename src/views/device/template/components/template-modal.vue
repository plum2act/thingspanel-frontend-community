<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { $t } from '@/locales'
import { initTemplateInfoData, templateInfoData } from '../utils'
import AddInfo from './step/add-info.vue'
import ModelDefinition from './step/model-definition.vue'
import WebChartConfig from './step/web-chart-config.vue'
import AppChartConfig from './step/app-chart-config.vue'
import Complete from './step/complete.vue'
import { useTheme } from '@/components/ux/useTheme'

export interface Props {
  visible: boolean
  type: 'add' | 'edit'
  templateId: string
  getTableData: () => void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'add'
})

const stepCurrent = ref<number>(1)
const deviceTemplateId = ref<string>(props.type === 'add' ? '' : props.templateId)

// 持有当前 step-1 组件实例以便在跳转时调用其 runStep1Next 校验+提交
const step1Ref = ref<InstanceType<typeof AddInfo> | null>(null)

const componentsList: { id: number; components: any }[] = [
  { id: 1, components: AddInfo },
  { id: 2, components: ModelDefinition },
  { id: 3, components: WebChartConfig },
  { id: 4, components: AppChartConfig },
  { id: 5, components: Complete }
]
const SwitchComponents = computed<any>(() => {
  return componentsList.find(item => item.id === stepCurrent.value)?.components
})

export type ModalType = NonNullable<Props['type']>

interface Emits {
  // eslint-disable-next-line no-unused-vars
  (e: 'update:visible', visible: boolean): void
}

const emit = defineEmits<Emits>()

const modalVisible = computed({
  get() {
    // eslint-disable-next-line vue/no-side-effects-in-computed-properties
    stepCurrent.value = 1
    if (!props.visible) {
      templateInfoData.value = { ...initTemplateInfoData }
    }
    return props.visible
  },
  set(visible) {
    emit('update:visible', visible)
  }
})
const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('device_template.addThingModel'),
    edit: $t('device_template.editThingModel')
  }
  return titles[props.type]
})

watchEffect(() => {
  deviceTemplateId.value = props.templateId
})

// 步骤点击：智能路由
// - 当前 step 1 且未提交(templateId 空)时，点击 step ≥2 先校验+提交 step1，成功才跳
// - 当前已提交(templateId 存在)，任意跳转直接生效
// - 编辑模式下 templateId 一开始就有，所有节点都可直接点
const handleStepClick = async (target: number) => {
  if (target === stepCurrent.value) return
  if (target > 1 && stepCurrent.value === 1 && !deviceTemplateId.value) {
    const ok = await step1Ref.value?.runStep1Next()
    if (!ok) return
  }
  stepCurrent.value = target
}

defineOptions({ name: 'TableActionModal' })

const { palette } = useTheme()
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="title"
    class="w-80%"
    @after-leave="
      () => {
        deviceTemplateId = props.templateId
        props.getTableData()
      }
    "
  >
    <n-steps :current="stepCurrent" status="process">
      <n-step
        :title="$t('device_template.basicInfo')"
        :description="$t('device_template.addDeviceInfo')"
        class="clickable-step"
        @click.stop="handleStepClick(1)"
      />
      <n-step
        :title="$t('device_template.modelDefinition')"
        :description="$t('device_template.deviceParameterDescribe')"
        class="clickable-step"
        @click.stop="handleStepClick(2)"
      />
      <n-step
        :title="$t('device_template.webChartConfiguration')"
        :description="$t('device_template.bindTheCorrespondingChart')"
        class="clickable-step"
        @click.stop="handleStepClick(3)"
      />
      <n-step
        :title="$t('device_template.appChartConfiguration')"
        :description="$t('device_template.editAppDetailsPage')"
        class="clickable-step"
        @click.stop="handleStepClick(4)"
      />
      <n-step
        :title="$t('device_template.release')"
        :description="$t('device_template.releaseAppStore')"
        class="clickable-step"
        @click.stop="handleStepClick(5)"
      />
    </n-steps>

    <component
      :is="SwitchComponents"
      ref="step1Ref"
      v-model:stepCurrent="stepCurrent"
      v-model:modalVisible="modalVisible"
      v-model:deviceTemplateId="deviceTemplateId"
    ></component>
  </NModal>
</template>

<style scoped>
.clickable-step {
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.clickable-step:hover {
  opacity: 0.85;
}

/* Phase 6 wizard steps：底色跟随 palette */
:deep(.n-steps) {
  background: v-bind('palette.bg2');
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 16px;
}
</style>
