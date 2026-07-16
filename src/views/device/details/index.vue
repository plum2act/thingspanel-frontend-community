<script setup lang="ts">
import { computed, getCurrentInstance, markRaw, nextTick, onBeforeMount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLoading } from '@sa/hooks'
import { useWebSocket } from '@vueuse/core'
import Telemetry from '@/views/device/details/modules/telemetry/telemetry.vue'
import TelemetryChart from '@/views/device/details/modules/telemetry-chart.vue'
import Join from '@/views/device/details/modules/join.vue'
import DeviceAnalysis from '@/views/device/details/modules/device-analysis.vue'
import Message from '@/views/device/details/modules/message.vue'
import Stats from '@/views/device/details/modules/stats.vue'
import EventReport from '@/views/device/details/modules/event-report.vue'
import CommandDelivery from '@/views/device/details/modules/command-delivery.vue'
import ExpectMessage from '@/views/device/details/modules/expect-message.vue'
import Automate from '@/views/device/details/modules/automate.vue'
import GiveAnAlarm from '@/views/device/details/modules/give-an-alarm.vue'
import Settings from '@/views/device/details/modules/settings.vue'
import DeviceStatusHistory from '@/views/device/details/modules/device-status.vue'
import DeviceDiagnosis from '@/views/device/details/modules/device-diagnosis.vue'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'
import { deviceAlarmStatus, deviceDetail, deviceUpdate } from '@/service/api/device'
import { useTheme } from '@/components/ux/useTheme'
import UxPageHeader from '@/components/ux/UxPageHeader.vue'
import UxStatusBadge from '@/components/ux/UxStatusBadge.vue'
import { localStg } from '@/utils/storage'
import { useRouterPush } from '@/hooks/common/router'
import { getWebsocketServerUrl } from '@/utils/common/tool'
import { hasThingsVisChartContent } from '@/utils/thingsvis/template-presets'
import { getCachedDeviceTemplateDetail } from '@/utils/thingsvis/template-detail-cache'
import { message } from '@/utils/common/discrete'
const route = useRoute()
const { query } = useRoute()
const appStore = useAppStore()
let { d_id } = query

const getDeviceId = () => {
  return (Array.isArray(d_id) ? d_id[0] : d_id) || ''
}

const { loading, startLoading, endLoading } = useLoading()

type TabCategory = 'live' | 'device' | 'communication' | 'alarm' | 'settings'

type TabComponent = {
  key: string
  name: () => string
  component: any
  refreshKey: number
  category: TabCategory
}

interface TabCategoryDef {
  key: TabCategory
  label: string
  icon: string
}

const { palette } = useTheme()

const baseComponents: TabComponent[] = [
  {
    key: 'chart',
    name: () => $t('custom.device_details.chart'),
    component: markRaw(TelemetryChart),
    refreshKey: 0,
    category: 'live'
  },
  {
    key: 'telemetry',
    name: () => $t('custom.device_details.telemetry'),
    component: markRaw(Telemetry),
    refreshKey: 0,
    category: 'live'
  },
  {
    key: 'join',
    name: () => $t('custom.device_details.join'),
    component: markRaw(Join),
    refreshKey: 0,
    category: 'device'
  },
  {
    key: 'device-analysis',
    name: () => $t('custom.device_details.subdevice'),
    component: markRaw(DeviceAnalysis),
    refreshKey: 0,
    category: 'device'
  },
  {
    key: 'message',
    name: () => $t('custom.device_details.AdditionalDetails'),
    component: markRaw(Message),
    refreshKey: 0,
    category: 'device'
  },
  {
    key: 'stats',
    name: () => $t('custom.device_details.attributes'),
    component: markRaw(Stats),
    refreshKey: 0,
    category: 'device'
  },
  {
    key: 'event-report',
    name: () => $t('custom.device_details.eventReport'),
    component: markRaw(EventReport),
    refreshKey: 0,
    category: 'communication'
  },
  {
    key: 'command-delivery',
    name: () => $t('custom.device_details.commandDelivery'),
    component: markRaw(CommandDelivery),
    refreshKey: 0,
    category: 'communication'
  },
  {
    key: 'expect-message',
    name: () => $t('custom.device_details.expectMessage'),
    component: markRaw(ExpectMessage),
    refreshKey: 0,
    category: 'communication'
  },
  {
    key: 'automate',
    name: () => $t('custom.device_details.automate'),
    component: markRaw(Automate),
    refreshKey: 0,
    category: 'communication'
  },
  {
    key: 'give-an-alarm',
    name: () => $t('custom.device_details.giveAnAlarm'),
    component: markRaw(GiveAnAlarm),
    refreshKey: 0,
    category: 'alarm'
  },
  {
    key: 'device-diagnosis',
    name: () => $t('custom.device_details.deviceDiagnosis'),
    component: markRaw(DeviceDiagnosis),
    refreshKey: 0,
    category: 'alarm'
  },
  {
    key: 'settings',
    name: () => $t('custom.device_details.settings'),
    component: markRaw(Settings),
    refreshKey: 0,
    category: 'settings'
  }
]

/**
 * Phase 5 顶层 5 分类定义（中文产品语）
 *
 * 顺序遵循「常用在前」：实时（最高频）→ 设备 → 通信 → 告警 → 设置
 */
const tabCategories: TabCategoryDef[] = [
  { key: 'live', label: '实时', icon: '◉' },
  { key: 'device', label: '设备', icon: '☰' },
  { key: 'communication', label: '通信', icon: '↔' },
  { key: 'alarm', label: '告警', icon: '!' },
  { key: 'settings', label: '设置', icon: '⚙' }
]

// 当前激活的分类（顶层 tab）。默认 'live'
const activeCategory = ref<TabCategory>('live')

// 各分类下的子 tab 列表（derived from components）。空分类在模板里隐藏
const tabsByCategory = computed<Record<TabCategory, TabComponent[]>>(() => {
  const map: Record<TabCategory, TabComponent[]> = {
    live: [],
    device: [],
    communication: [],
    alarm: [],
    settings: []
  }
  for (const c of components.value) map[c.category].push(c)
  return map
})

const templateChartAvailabilityCache = new Map<string, boolean>()

const components = ref<TabComponent[]>([])

const tabsRenderKey = ref(0)
let lastTabsSig = ''

function getPreferredTabKey() {
  const keys = components.value.map(item => item.key)

  // Prefer chart first, otherwise telemetry, otherwise the first available.
  if (keys.includes('chart')) return 'chart'
  if (keys.includes('telemetry')) return 'telemetry'
  return components.value[0]?.key || ''
}

function ensureActiveTab() {
  const preferredKey = getPreferredTabKey()
  if (!preferredKey) {
    tabValue.value = ''
    return
  }

  const exists = components.value.some(item => item.key === tabValue.value)
  if (!exists) tabValue.value = preferredKey

  // Phase 5: 同步 activeCategory 与 lastCategoryTab，确保第一次进入页面
  // 能落到对应分类（兼容老 URL ?tab=telemetry）
  const target = components.value.find(c => c.key === tabValue.value)
  if (target) {
    activeCategory.value = target.category
    lastCategoryTab[target.category] = tabValue.value
  }
}

function bumpRefreshKey(targetKey: string) {
  const current = components.value.find(item => item.key === targetKey)
  if (current) current.refreshKey += 1
}

// Default active: will be set by ensureActiveTab after data loads
const tabValue = ref<string>('')
const showDialog = ref(false)
const showStatusHistoryDialog = ref(false)
const labels = ref<string[]>([])

const deviceData: any = ref({})
const device_type = ref('')
const icon_type = ref('')
const name = ref('')
const device_number = ref('')
const device_is_online = ref(0)
const device_loop = ref(false)
let wsUrl = getWebsocketServerUrl()

wsUrl += `/device/online/status/ws`
const normalizeOnlineStatus = (payload: unknown): number | null => {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const status = normalizeOnlineStatus(item)
      if (status !== null) return status
    }
    return null
  }
  if (!payload || typeof payload !== 'object') return null
  const info = payload as Record<string, unknown>
  if (info.data !== undefined) return normalizeOnlineStatus(info.data)
  if (info.payload !== undefined) return normalizeOnlineStatus(info.payload)

  const targetDeviceId = getDeviceId()
  const frameDeviceId = info.device_id ?? info.deviceId
  if (frameDeviceId && String(frameDeviceId) !== String(targetDeviceId)) return null

  const rawStatus = info.is_online ?? info.isOnline
  if (typeof rawStatus === 'boolean') return rawStatus ? 1 : 0
  if (typeof rawStatus === 'number') return rawStatus === 1 ? 1 : 0
  if (typeof rawStatus === 'string') {
    const normalized = rawStatus.trim().toLowerCase()
    if (normalized === '1' || normalized === 'true' || normalized === 'online') return 1
    if (normalized === '0' || normalized === 'false' || normalized === 'offline') return 0
  }

  return null
}
const { send } = useWebSocket(wsUrl, {
  heartbeat: {
    message: 'ping',
    interval: 8000,
    pongTimeout: 3000
  },
  onMessage(_ws: WebSocket, event: MessageEvent) {
    if (event.data && event.data !== 'pong') {
      try {
        const status = normalizeOnlineStatus(JSON.parse(event.data))
        if (status !== null) {
          device_is_online.value = status
        }
      } catch {
        // ignore non-JSON frames
      }
    }
  }
})

const queryParams = reactive({
  label: '',
  id: '',
  name: '',
  device_number: '',
  description: ''
})
const changeTabs = v => {
  startLoading()

  const key = String(v)
  tabValue.value = key
  // 记录：当前分类下用户选中的子 tab
  if (components.value.find(c => c.key === key)) {
    const cat = components.value.find(c => c.key === key)!.category
    lastCategoryTab[cat] = key
  }
  setTimeout(() => {
    endLoading()
  }, 500)
}

/**
 * Phase 5 顶层分类切换 — 不重置 sub-tab，让用户在「实时 / 设备 / 通信」之间
 * 自由跳时保留各自最后访问的子 tab。
 *
 * 子 tab 状态由组件实例本身持有（component.refreshKey），切换分类不
 * unmount 既有子组件（因为 n-tabs 用 v-show/v-if 控制可见性，sub-tabs 渲染
 * 仍跟 activeCategory 联动）。
 */
const lastCategoryTab = reactive<Record<TabCategory, string>>({
  live: '',
  device: '',
  communication: '',
  alarm: '',
  settings: ''
})

function onCategoryChange(category: TabCategory) {
  // 同步 URL ?tab= 保持旧链接兼容
  const target = lastCategoryTab[category] || (tabsByCategory.value[category][0]?.key ?? '')
  if (target && tabValue.value !== target) {
    tabValue.value = target
  }
}
const editConfig = () => {
  showDialog.value = true
}

const rules = {
  name: {
    required: true,
    message: $t('custom.devicePage.enterDeviceName'),
    trigger: 'blur'
  },
  device_number: {
    required: true,
    message: $t('custom.devicePage.enterDeviceNumber'),
    trigger: 'blur'
  }
}
const getDeviceDetail = async () => {
  device_loop.value = false
  const { error, data } = await deviceDetail(getDeviceId())
  device_loop.value = true
  deviceData.value = data
  labels.value.length = 0

  if (data.label) {
    if (data.label.includes(',')) {
      labels.value = data.label.split(',')
    } else {
      labels.value.push(data.label)
    }
  }
  if (!error) {
    device_number.value = data.device_number
    device_is_online.value = data.is_online
    name.value = data.name

    // 构建过滤后的组件列表（一次性赋值，避免多次触发响应式更新）
    let filtered = baseComponents.map(item => ({ ...item }))
    let hasTemplateChart = false

    if (data?.device_config) {
      device_type.value = data.device_config.device_type
      if (device_type.value !== '2' || !data?.device_config_name) {
          filtered = filtered.filter(item => item.key !== 'device-analysis')
      }
      if (device_type.value === '3') {
          filtered = filtered.filter(item => item.key !== 'join')
      }
      if (data.device_config.device_template_id) {
          hasTemplateChart = await resolveTemplateHasChartContent(data.device_config.device_template_id)
      }
      if (!data.device_config.device_template_id || !hasTemplateChart) {
          filtered = filtered.filter(item => item.key !== 'chart')
      }
    } else if (!data?.device_config_name) {
        filtered = filtered.filter(item => item.key !== 'device-analysis')
        filtered = filtered.filter(item => item.key !== 'chart')
    }

    // 一次性赋值
    components.value = filtered

    ensureActiveTab()

    const nextSig = components.value.map(item => item.key).join('|')
    if (nextSig !== lastTabsSig) {
      const isFirstRender = lastTabsSig === ''
      lastTabsSig = nextSig
      if (!isFirstRender) {
        await nextTick()
        tabsRenderKey.value += 1
      }
    }

    send(
      JSON.stringify({
        device_id: getDeviceId(),
        token: localStg.get('token')
      })
    )
  }
}

const resolveTemplateHasChartContent = async (templateId?: string | number) => {
  const normalizedTemplateId = String(templateId || '').trim()
  if (!normalizedTemplateId) return false

  if (templateChartAvailabilityCache.has(normalizedTemplateId)) {
    return templateChartAvailabilityCache.get(normalizedTemplateId) || false
  }

  try {
    const res = await getCachedDeviceTemplateDetail(normalizedTemplateId)
    const template = res?.data || {}
    const hasChart =
      hasThingsVisChartContent(template?.web_chart_config) ||
      hasThingsVisChartContent(template?.app_chart_config)

    templateChartAvailabilityCache.set(normalizedTemplateId, hasChart)
    return hasChart
  } catch (err) {
    console.warn('[DeviceDetail] 加载模板图表标签失败', normalizedTemplateId, err)
    templateChartAvailabilityCache.set(normalizedTemplateId, false)
    return false
  }
}
const closeModal = async () => {
  await getDeviceDetail()
  showDialog.value = false
}
const { routerPushByKey } = useRouterPush()
const clickConfig: () => void = () => {
  routerPushByKey('device_config-detail', {
    query: {
      id: deviceData.value?.device_config_id
    }
  })
}
const clickGateway = () => {
  routerPushByKey('device_details', {
    query: {
      d_id: deviceData.value?.parent_id
    }
  })
}
const alarmStatus = ref(false)
const getAlarmStatus = async () => {
  const { data } = await deviceAlarmStatus({ device_id: getDeviceId() })
  alarmStatus.value = data.alarm
}

onBeforeMount(() => {
  getDeviceDetail()
  getAlarmStatus()
})

watch(
  () => route.query.d_id,
  async newVal => {
    d_id = newVal
    await getDeviceDetail()
    bumpRefreshKey(tabValue.value)
    await getAlarmStatus()
  },
  { deep: true }
)

const save = async () => {
  if (!deviceData.value?.name) {
    message.error($t('custom.devicePage.enterDeviceName'))
    return
  }
  if (!deviceData.value?.device_number) {
    message.error($t('custom.devicePage.enterDeviceNumber'))
    return
  }
  if (deviceData.value?.device_number.length > 100) {
    message.error($t('custom.devicePage.deviceNumberMax'))
    return
  }
  device_number.value = deviceData.value.device_number
  queryParams.id = deviceData.value?.id
  queryParams.name = deviceData.value?.name
  queryParams.device_number = deviceData.value?.device_number
  queryParams.label = labels.value.join(',')
  queryParams.description = deviceData.value?.description

  const { error } = await deviceUpdate(queryParams)
  if (!error) {
    showDialog.value = false
    getDeviceDetail()
  }
}
watch(
  () => appStore.locale,
  () => {
    let temporary: any
    // eslint-disable-next-line prefer-const
    temporary = tabValue.value
    tabValue.value = ''
    setTimeout(() => {
      tabValue.value = temporary
    }, 50)
  }
)
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})

const isEmbeddedHost = computed(() => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
})
</script>

<template>
  <div class="device-details-page" :class="{ 'device-details-page--embedded': isEmbeddedHost }">
    <UxPageHeader
      class="device-details-ux-header"
      :title="name || '--'"
      :online="device_is_online === 1"
      :diagnosis="icon_type || undefined"
      :warn-count="alarmStatus ? 1 : 0"
      :device-number="deviceData?.device_number || device_number"
      :address="deviceData?.device_config?.protocol_type"
      :last-seen="deviceData?.updated_at"
      :subtitle="$t('custom.devicePage.deviceDetails')"
      @back="() => history.back()"
    />
    <section class="device-details-shell">
      <div class="device-details-header">
        <div class="device-details-title-row">
          <span class="device-details-title">{{ name || '--' }}</span>
          <NButton v-show="true" type="primary" @click="editConfig">
            {{ $t('common.edit') }}
          </NButton>
        </div>

        <n-modal
          v-model:show="showDialog"
          :title="$t('generate.issue-attribute')"
          :class="getPlatform ? 'w-90%' : 'w-400px'"
        >
          <n-card>
            <n-form :model="deviceData" :rules="rules">
              <div>
                <NH3>{{ $t('generate.modify-device-info') }}</NH3>
              </div>
              <n-form-item :label="$t('page.irrigation.group.deviceName')" path="name">
                <n-input v-model:value="deviceData.name" aria-required="true" />
              </n-form-item>
              <n-form-item :label="$t('generate.device-code')" path="device_number">
                <n-input v-model:value="deviceData.device_number" />
              </n-form-item>
              <n-form-item :label="$t('custom.devicePage.label')" path="label">
                <n-dynamic-tags v-model:value="labels" />
              </n-form-item>
              <n-form-item :label="$t('generate.device-description')">
                <!-- <n-input v-model:value="queryParams.deviceDescribe" type="textarea"/> -->
                <NInput v-model:value="deviceData.description" type="textarea" />
              </n-form-item>
              <n-space>
                <n-button @click="closeModal">{{ $t('generate.cancel') }}</n-button>
                <n-button @click="save">{{ $t('common.save') }}</n-button>
              </n-space>
            </n-form>
          </n-card>
        </n-modal>

        <DeviceStatusHistory
          v-model:visible="showStatusHistoryDialog"
          :device-id="getDeviceId()"
        />

        <NFlex class="device-details-meta">
          <div class="device-details-meta-item">
            <span class="device-details-meta-label">ID:</span>
            <span>{{ getDeviceId() || '--' }}</span>
          </div>
          <div class="device-details-meta-item">
            <span class="device-details-meta-label">{{ $t('custom.devicePage.configTemplate') }} :</span>
            <span
              v-if="deviceData?.device_config_name"
              class="device-details-link"
              @click="clickConfig"
            >
              {{ deviceData?.device_config_name }}
            </span>
            <span v-else>--</span>
          </div>
          <div v-if="device_type === '3'" class="device-details-meta-item">
            <span class="device-details-meta-label">{{ $t('generate.gateway') }}:</span>
            <span class="device-details-link" @click="clickGateway">
              {{ deviceData?.gateway_device_name || '--' }}
            </span>
          </div>
          <!-- 在线/离线，弹窗展示详情 -->
          <div
            class="device-details-status"
            @click="showStatusHistoryDialog = true"
          >
            <!-- <span class="mr-2">{{ $t('generate.status') }}:</span> -->
            <SvgIcon
              local-icon="CellTowerRound"
              style="color: #ccc; margin-right: 5px"
              class="text-20px text-primary"
              :stroke="device_is_online === 1 ? 'rgb(2,153,52)' : '#ccc'"
            />
            <span
              :style="{
                color: device_is_online === 1 ? 'rgb(2,153,52)' : '#ccc'
              }"
            >
              {{ device_is_online === 1 ? $t('custom.device_details.online') : $t('custom.device_details.offline') }}
            </span>

            <!-- 历史记录 -->
            <SvgIcon
              local-icon="history"
              style="margin-left: 5px;"
              class="text-18px text-primary"
            />
          </div>
          <div class="device-details-status device-details-status--alarm">
            <template v-if="alarmStatus === true">
              <SvgIcon
                local-icon="AlertFilled"
                style="color: #ee0808; margin-right: 5px"
                class="text-20px text-primary"
                :stroke="icon_type"
              />
              <span style="color: #ee0808">{{ $t('custom.device_details.alarm') }}</span>
            </template>
            <template v-if="alarmStatus === false">
              <SvgIcon
                local-icon="AlertFilled"
                style="color: #ccc; margin-right: 5px"
                class="text-20px text-primary"
                :stroke="icon_type"
              />
              <span style="color: #ccc">{{ $t('custom.device_details.noAlarm') }}</span>
            </template>
          </div>
        </NFlex>
      </div>
      <div class="device-details-content">
        <!-- Phase 5: 顶层分类 tabs（5 个：实时 / 设备 / 通信 / 告警 / 设置） -->
        <n-tabs
          :key="`cat-${tabsRenderKey}`"
          v-model:value="activeCategory"
          class="device-details-tabs device-details-tabs--category"
          type="line"
          @update:value="onCategoryChange"
        >
          <n-tab-pane
            v-for="cat in tabCategories"
            v-show="tabsByCategory[cat.key].length > 0"
            :key="cat.key"
            :tab="`${cat.icon}  ${cat.label}`"
            :name="cat.key"
          />
        </n-tabs>

        <!-- 子 tabs：当前分类下的具体功能（原 13 个） -->
        <n-tabs
          :key="`sub-${tabsRenderKey}`"
          v-model:value="tabValue"
          class="device-details-tabs device-details-tabs--sub"
          type="segment"
          @update:value="changeTabs"
        >
          <n-tab-pane
            v-for="component in tabsByCategory[activeCategory]"
            :key="component.key"
            :tab="component.name()"
            :name="component.key"
          >
            <n-spin class="device-details-tab-body" size="small" :show="loading">
              <component
                :is="component.component"
                :id="getDeviceId()"
                :key="component.refreshKey"
                :online="device_is_online"
                :device-data="deviceData"
                :device-config-id="deviceData?.device_config_id || ''"
                :device-template-id="deviceData?.device_config?.device_template_id"
                @change="getDeviceDetail"
              />
            </n-spin>
          </n-tab-pane>
        </n-tabs>
      </div>
    </section>
  </div>
</template>

<style scoped>
.device-details-page {
  padding: 12px;
}

.device-details-page--embedded {
  padding: 8px;
}

.device-details-shell {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid v-bind('palette.border1');
  background: v-bind('palette.bg1');
}

.device-details-page--embedded .device-details-shell {
  border-radius: 10px;
}

.device-details-header {
  padding: 18px 20px 8px;
}

.device-details-page--embedded .device-details-header {
  padding: 16px 18px 6px;
}

.device-details-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.device-details-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  color: inherit;
}

.device-details-meta {
  margin-top: 10px;
  gap: 10px 16px;
  color: inherit;
}

.device-details-meta-item {
  display: flex;
  align-items: center;
  min-height: 28px;
}

.device-details-meta-label {
  margin-right: 8px;
  color: #666;
}

.device-details-link {
  color: blue;
  cursor: pointer;
}

.device-details-status {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.device-details-status--alarm {
  cursor: default;
}

.device-details-content {
  padding-bottom: 8px;
}

.device-details-page--embedded .device-details-content {
  padding-bottom: 8px;
}

.device-details-tab-body {
  padding: 10px 14px 14px;
}

.device-details-page--embedded .device-details-tab-body {
  padding: 10px 12px 12px;
}

:deep(.device-details-tabs--category .n-tabs-nav) {
  padding: 0 20px;
  background: v-bind('palette.bg2');
  border-radius: 12px 12px 0 0;
}

:deep(.device-details-tabs--sub .n-tabs-nav) {
  padding: 0 20px;
  background: v-bind('palette.bg1');
}

:deep(.device-details-tabs--sub .n-tabs-tab) {
  padding-bottom: 12px;
  font-weight: 500;
}

:deep(.device-details-page--embedded .device-details-tabs .n-tabs-nav) {
  padding: 0 18px;
}

:deep(.device-details-tabs .n-tabs-nav::before) {
  border-bottom-color: v-bind('palette.border1');
}

:deep(.device-details-tabs .n-tabs-tab) {
  padding-bottom: 12px;
  font-weight: 500;
}

:deep(.device-details-tabs .n-tab-pane) {
  padding-top: 0;
}
</style>
