<script setup lang="tsx">
import { computed, getCurrentInstance, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { NumberAnimationInst } from 'naive-ui'
import dayjs from 'dayjs'
import { Activity } from '@vicons/tabler'
import { DocumentOnePage24Regular } from '@vicons/fluent'
import { useIntervalFn, useWebSocket } from '@vueuse/core'
import { MovingNumbers } from 'moving-numbers-vue3'
import moment from 'moment'
import TempGroup from './groups/TempGroup.vue'
import AnalogGroup from './groups/AnalogGroup.vue'
import StatusGroup from './groups/StatusGroup.vue'
import EnergyGroup from './groups/EnergyGroup.vue'
import CounterGroup from './groups/CounterGroup.vue'
import OtherGroup from './groups/OtherGroup.vue'
import {
  expectMessageAdd,
  getSimulation,
  getTelemetryLogList,
  sendSimulation,
  telemetryDataCurrent,
  telemetryDataDel,
  telemetryDataPub
} from '@/service/api'
import { localStg } from '@/utils/storage'
import { deviceDetail } from '@/service/api/device'
import { $t } from '@/locales'
import { getWebsocketServerUrl, isJSON } from '@/utils/common/tool'
import { deviceCustomControlList } from '@/service/api/system-data'
import HistoryData from './modules/history-data.vue'
import TimeSeriesData from './modules/time-series-data.vue'
import SparkLine from './modules/SparkLine.vue'
import { formatRelativeTime } from '@/utils/common/datetime'
import { useLoading } from '~/packages/hooks'
const props = defineProps<{
  id: string
  deviceTemplateId: string
}>()

let wsUrl = getWebsocketServerUrl()
wsUrl += '/telemetry/datas/current/ws'
const showDialog = ref(false)
const showLogDialog = ref(false)
const showHistory = ref(false)
const telemetryId = ref()
const telemetryKey = ref()
const telemetryName = ref()
const telemetryUnit = ref()
const modelType = ref<string>('')

const formValue = ref('')
const form = reactive({
  expected: false,
  time: null
})
const operationType = ref('')
const sendResult = ref('')
const tableData = ref([])

const telemetryData = ref<DeviceManagement.telemetryData[]>([])
const initTelemetryData = ref<any>()
const numberAnimationInstRef = ref<NumberAnimationInst[] | []>([])
const { loading, startLoading, endLoading } = useLoading()
const total = ref(0)
const showLog = ref(false)
const device_order = ref('')
const operationOptions = [
  { label: $t('custom.device_details.whole'), value: '' },
  { label: $t('custom.device_details.manualOperation'), value: '1' },
  { label: $t('custom.device_details.triggerOperation'), value: '2' }
  // 其他操作类型选项...
]
const resultOptions = [
  { label: $t('custom.device_details.whole'), value: '' },
  { label: $t('custom.devicePage.success'), value: '1' },
  { label: $t('custom.devicePage.fail'), value: '2' }
  // 其他发送结果选项...
]
const cardMargin = ref(15) // 卡片的间距
const log_page = ref(1)
const showError = ref(false)
const erroMessage = ref('')

const token = localStg.get('token')

const { status, send, close } = useWebSocket(wsUrl, {
  heartbeat: {
    message: 'ping',
    interval: 8000,
    pongTimeout: 3000
  },
  // eslint-disable-next-line
  onMessage(ws: WebSocket, event: MessageEvent) {
    if (event.data && event.data !== 'pong') {
      const info = JSON.parse(event.data)
      const currTelemetryKey = telemetryData.value
        .map(item => {
          return item.key === 'systime' ? false : item.key
        })
        .filter(item => Boolean(item))
      const newData = telemetryData.value.map(item => {
        return {
          ...item,
          value:
            info[item.key] === null || info[item.key] === undefined || info[item.key] === ''
              ? item.value
              : info[item.key],
          ts: info[item.key] && info.systime ? info.systime : item.ts || ''
        }
      })
      const newTelemetry: any[] = []
      for (const key in info) {
        if (key !== 'systime' && !currTelemetryKey.includes(key)) {
          const { key: _originKey, label: _label, ...rest } = initTelemetryData.value
          newTelemetry.push({
            ...rest,
            key,
            value: info[key],
            ts: info.systime,
            unit: ''
          })
        }
      }
      telemetryData.value = [...newData, ...newTelemetry]

      // ④ 累积 sparkline 实时数据（纯前端，严格追加，不动上面三步）
      const sparkTs = info.systime ? dayjs(info.systime).valueOf() : Date.now()
      for (const key in info) {
        if (key === 'systime') continue
        pushSpark(key, info[key], sparkTs)
      }
    }
  }
})

const columns = [
  {
    title: $t('custom.device_details.command'),
    minWidth: '140px',
    key: 'data'
  },
  {
    title: $t('custom.device_details.operationType'),
    key: 'operation_type',
    minWidth: '140px',
    render: row => (row.operation_type === '1' ? $t('custom.device_details.manualOperation') : $t('card.triggerAction'))
  },
  {
    title: $t('custom.device_details.operationUsers'),
    minWidth: '140px',
    key: 'username',
    render: row => (row.operation_type === '1' ? row.username : $t('generate.system'))
  },
  {
    title: $t('custom.device_details.operationTime'),
    key: 'created_at',
    minWidth: '140px',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: $t('custom.device_details.sendResults'),
    minWidth: '140px',
    key: 'status',
    render: row => (row.status === '1' ? $t('custom.devicePage.success') : $t('custom.devicePage.fail'))
  }
]
const requestSimulationList = async () => {
  const { data, error } = await getSimulation({
    device_id: props.id
  })
  if (!error) {
    device_order.value = data
  }
}

const openDialog = () => {
  showDialog.value = true
  formValue.value = ''
  form.expected = false
  form.time = null
}
const openUpLog = () => {
  showError.value = false
  showLogDialog.value = true
  requestSimulationList()
}

const sendSimulationList = async () => {
  if (!device_order.value) {
    window.$message?.error($t('custom.device_details.sendInputData'))
    return
  }
  const { error } = await sendSimulation({
    command: device_order.value
  })
  if (!error) {
    showLogDialog.value = false
    showError.value = false
  } else {
    showError.value = true
    erroMessage.value = error?.response?.data?.message
  }
}
const fetchData = async () => {
  startLoading()
  const { data, error } = await getTelemetryLogList({
    page: log_page.value,
    page_size: 5,
    device_id: props.id,
    operation_type: operationType.value,
    status: sendResult.value
  })
  if (!error) {
    tableData.value = data?.value || data.list
    total.value = Math.ceil(data.count / 5)
    endLoading()
  }
}

const fetchTelemetry = async () => {
  const { data, error } = await telemetryDataCurrent(props.id)
  if (!error && data) {
    telemetryData.value = data
    // 预热 sparkline 首点（仅数值型），首屏不至于完全空白
    const preheatTs = Date.now()
    data.forEach((item: any) => {
      pushSpark(item.key, item.value, item.ts ? dayjs(item.ts).valueOf() : preheatTs)
    })
    initTelemetryData.value = data[0] || {} // 存储一份模板
    initTelemetryData.value.device_id = props.id
    const dataw = {
      // eslint-disable-next-line no-constant-binary-expression
      device_id: props.id,
      token
    }

    send(JSON.stringify(dataw))
  }
}
const setItemRef = el => {
  if (el) {
    const index = el.$attrs['data-index']
    numberAnimationInstRef.value[index] = el
  }
}
const getDeviceDetail = async () => {
  const { data, error } = await deviceDetail(props.id)
  if (!error) {
    if (data.device_config !== undefined) {
      if (data.device_config.protocol_type === 'MQTT') {
        showLog.value = true
      } else {
        showLog.value = false
      }
    } else {
      showLog.value = true
    }
  }
}
getDeviceDetail()

const options = ref([
  {
    label: $t('custom.device_details.deleteAttribute'),
    key: '1'
  }
])

const delparam: any = ref({})

const handleDeleteTable = async () => {
  const { error }: any = await telemetryDataDel(delparam.value)

  if (!error) {
    fetchTelemetry()
  }
}

const handleSelect = (key, item) => {
  if (String(key) === '1') {
    delparam.value = {
      key: item.key,
      device_id: props.id
    }
    handleDeleteTable()
  }
}
const copy = event => {
  const input = event.target
  input.select()
  document.execCommand('copy')
  window.$message?.success($t('theme.configOperation.copySuccess'))
}
const handlePositiveClick = async () => {
  if (isJSON(formValue.value)) {
    let res: any = {}
    if (form.expected) {
      // 新增期望消息
      const expiry = new Date().getTime() + (form.time ? form.time * 60 * 60 * 1000 : 0)
      res = await expectMessageAdd({
        device_id: props.id,
        payload: formValue.value,
        send_type: 'telemetry',
        expiry: moment(expiry).format('YYYY-MM-DDTHH:mm:ssZ')
      })
    } else {
      // 发送属性的逻辑...
      res = await telemetryDataPub({
        device_id: props.id,
        value: formValue.value
      })
    }
    if (res && !res.error) {
      showDialog.value = false
      fetchData()
      fetchTelemetry()
    }
  }
}

const onTapTableTools = (i: any) => {
  if (typeof i.value === 'number') {
    modelType.value = $t('custom.device_details.sequential')
    telemetryKey.value = i.key
    telemetryName.value = i.label
    telemetryId.value = i.device_id
    telemetryUnit.value = i.unit
    showHistory.value = true
  }
}

const isColor = (i: any) => {
  if (typeof i.value !== 'number') {
    return '#cccccc'
  }
  return ''
}

const controlList = ref<any[]>([])
const getControlList = () => {
  if (props.deviceTemplateId) {
    const queryjson = {
      device_template_id: props.deviceTemplateId,
      page: 1,
      page_size: 100,
      enable_status: 'enable'
    }
    deviceCustomControlList(queryjson).then(({ data }) => {
      controlList.value = data.list || []
    })
  }
}

watch(
  () => props.deviceTemplateId,
  val => {
    if (!val) return
    getControlList()
  }
)
// 设备切换：清空 sparkline 缓冲，防点位串台
watch(
  () => props.id,
  () => {
    sparkBuffer.value = {}
  }
)
onMounted(() => {
  fetchData()
  fetchTelemetry()
  getControlList()
})

onUnmounted(() => {
  pauseTick()
  if (status.value === 'OPEN') {
    close()
  }
})

const onControlChange = async (row: any) => {
  await telemetryDataPub({
    device_id: props.id,
    value: row.content
  })
  fetchData()
}

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})

const validationJson = computed(() => {
  if (formValue.value && !isJSON(formValue.value)) {
    return 'error'
  }
  return undefined
})
const inputFeedback = computed(() => {
  if (formValue.value && !isJSON(formValue.value)) {
    return $t('generate.inputRightJson')
  }
  return ''
})

// ================================================================
// 遥测值/键格式化（设备详情·遥测 Tab 显示优化）
// ================================================================
type FormattedValue = {
  /** 'json' = 解析后的位/键值对；'hex' = 已分组的 645 原始 hex；'string' = 通用文本；'empty' = 无值 */
  kind: 'json' | 'hex' | 'string' | 'empty'
  /** 卡片主显示文本（JSON 位标签渲染时仅作 fallback，hex 时为分组大写） */
  display: string
  /** 仅 kind='json' 时存在；按原始 key 顺序、boolean→"开/关" */
  pairs?: Array<{ key: string; value: string }>
  /** 原始值字符串，用于 hover tooltip 完整显示 */
  raw: string
}

const BIT_LABEL_OF: Record<string, string> = {
  bit0: '位0',
  bit1: '位1',
  bit2: '位2',
  bit3: '位3',
  bit4: '位4',
  bit5: '位5',
  bit6: '位6',
  bit7: '位7',
  bit8: '位8',
  bit9: '位9',
  bit10: '位10',
  bit11: '位11',
  bit12: '位12',
  bit13: '位13',
  bit14: '位14',
  bit15: '位15'
}

/**
 * 把后端原始值分类、归一化为卡片友好的显示结构。
 *
 * 设计意图：设备上行可能直接喷 DL/T 645 原始数据（长 hex 串 / JSON 位域 / 字符串），
 * 这里把它们转成"对运维人员一眼能读"的形态；纯数字仍由 MovingNumbers 处理，
 * 此函数仅在被 isColor(i) 判定为非数字时调用，不会冲突。
 */
function formatTelemetryValue(item: any): FormattedValue {
  let raw0 = item?.value
  if (raw0 === null || raw0 === undefined || raw0 === '') {
    return { kind: 'empty', display: '—', raw: '' }
  }

  // 0) 字符串若长得像 JSON 对象/数组，先尝试 parse。
  //    ThingsPanel 后端常将 telemetry 值序列化为 JSON 字符串下发（如 DI 状态
  //    "{\"bit0\":true,\"bit1\":false,...}"），此时 typeof === 'string'，
  //    原代码会落到 'string' 分支把整段 JSON 直接喷到卡片，看起来"没解析"。
  //    这里先 parse 再走下面的对象分支即可识别。
  if (typeof raw0 === 'string') {
    const trimmed = raw0.trim()
    if (
      trimmed.length > 1 &&
      ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']')))
    ) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed !== null && typeof parsed === 'object') {
          raw0 = parsed
        }
      } catch {
        /* 不是合法 JSON，保持原字符串走通用文本分支 */
      }
    }
  }

  // 1) JSON 对象 / 数组（典型如 DI 状态 {"bit0":true,"bit1":false,...}）
  if (typeof raw0 === 'object') {
    let pairs: Array<{ key: string; value: string }> = []
    let display = ''
    try {
      const obj = raw0 as Record<string, unknown>
      const keys = Object.keys(obj)
      pairs = keys.map(k => {
        const val = obj[k]
        if (typeof val === 'boolean') {
          return { key: BIT_LABEL_OF[k] || k, value: val ? '开' : '关' }
        }
        if (typeof val === 'number') {
          return { key: BIT_LABEL_OF[k] || k, value: val ? '开' : '关' }
        }
        return { key: BIT_LABEL_OF[k] || k, value: String(val) }
      })
      display = pairs.map(p => `${p.key} ${p.value}`).join(' · ')
    } catch {
      display = String(raw0)
    }
    let rawStr = ''
    try {
      rawStr = JSON.stringify(raw0)
    } catch {
      rawStr = String(raw0)
    }
    return { kind: 'json', display, pairs, raw: rawStr }
  }

  // 2) DL/T 645 原始 hex 串（>=8 位连续 hex，整字节对齐）—— 典型如 raw_data 卡
  const str = String(raw0).trim()
  if (/^[0-9a-fA-F]{8,}$/.test(str) && str.length % 2 === 0) {
    const grouped = (str.match(/.{1,2}/g) || []).join(' ').toUpperCase()
    return { kind: 'hex', display: grouped, raw: str }
  }

  // 3) 6 位 hex（裸 DI 值段，如 "0123"）—— 也按 hex 分组
  if (/^[0-9a-fA-F]{6,}$/.test(str)) {
    const grouped = (str.match(/.{1,2}/g) || []).join(' ').toUpperCase()
    return { kind: 'hex', display: grouped, raw: str }
  }

  // 4) 通用字符串：截断防撑破卡片
  const display = str.length > 36 ? `${str.slice(0, 33)}…` : str
  return { kind: 'string', display, raw: str }
}

/**
 * 卡片标题：友好化显示
 * - 有 label：保留 "label (key)" 原貌
 * - 无 label：把原始 DI 码降级为 "未命名点位 (DI: xxxxxxxx)"，避免把 di_00010202 这类
 *   裸码直接当卡片标题
 */
function formatTelemetryTitle(item: any): string {
  if (item?.label) return item.label
  if (item?.key) return '未命名点位'
  return ''
}

// ================================================================
// 仪表盘风格：sparkline 累积缓冲 + 变化% + 状态徽章 + tick
// ================================================================
const SPARK_MAX = 30

/** sparkline 滚动窗口缓冲：key → [{ts,value}]。整体引用替换保证响应式。 */
const sparkBuffer = ref<Record<string, Array<{ ts: number; value: number }>>>({})

/**
 * 推入一个实时点到对应 key 的 sparkline 缓冲。
 * - 仅接受数值型 & 有限值，其余跳过（非数值型不画趋势线）
 * - FIFO 限长 SPARK_MAX
 * - 用整体引用替换（不直接 mutate / 不用 Map.set），规避 Vue 响应式坑
 */
function pushSpark(key: string, value: unknown, ts: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return
  const prev = sparkBuffer.value[key] || []
  const next = [...prev, { ts, value }]
  while (next.length > SPARK_MAX) next.shift()
  sparkBuffer.value = { ...sparkBuffer.value, [key]: next }
}

/**
 * 变化百分比：(latest - oldest) / |oldest| × 100，基于累积窗口首尾。
 * 窗口 < 2 点、oldest===0、或不收敛 → null（不渲染徽章）。
 */
function deltaPercent(i: any): number | null {
  const buf = sparkBuffer.value[i.key]
  if (!buf || buf.length < 2) return null
  const oldest = buf[0].value
  const latest = buf[buf.length - 1].value
  if (!Number.isFinite(oldest) || !Number.isFinite(latest)) return null
  if (oldest === 0) return null
  const pct = ((latest - oldest) / Math.abs(oldest)) * 100
  if (!Number.isFinite(pct)) return null
  return Math.round(pct * 10) / 10
}

function deltaClass(i: any): string {
  const p = deltaPercent(i)
  if (p === null || p === 0) return 'metric-delta--flat'
  return p > 0 ? 'metric-delta--up' : 'metric-delta--down'
}

function deltaArrow(i: any): string {
  const p = deltaPercent(i)
  if (p === null || p === 0) return ''
  return p > 0 ? '↑' : '↓'
}

// ================================================================
// 状态徽章：online / offline / no-data
// ================================================================
const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000 // 3 分钟无新值判离线（常量易调）
const tick = ref(0)
const { pause: pauseTick } = useIntervalFn(
  () => {
    tick.value++
  },
  30 * 1000
)

type MetricStatus = 'online' | 'offline' | 'no-data'

function getStatus(i: any): MetricStatus {
  void tick.value // 30s tick 触发重算（ts / Date.now 本身非响应式）
  if (!i?.ts) return 'no-data'
  const t = dayjs(i.ts)
  if (!t.isValid()) return 'no-data'
  return Date.now() - t.valueOf() < OFFLINE_THRESHOLD_MS ? 'online' : 'offline'
}

function statusLabel(i: any): string {
  const s = getStatus(i)
  if (s === 'online') return $t('custom.device_details.online')
  if (s === 'offline') return $t('custom.device_details.offline')
  return $t('common.noData')
}

function statusTagType(i: any): 'success' | 'default' | 'warning' {
  const s = getStatus(i)
  if (s === 'online') return 'success'
  if (s === 'offline') return 'default'
  return 'warning'
}

function metricCardClass(i: any): string {
  const s = getStatus(i)
  if (s === 'offline') return 'metric-card--offline'
  if (s === 'no-data') return 'metric-card--nodata'
  return ''
}

// ================================================================
// 遥测指标按语义分组（业界电力监控 / SCADA 通用分类）
// ================================================================
type TelemetryGroup = 'temp' | 'analog' | 'status' | 'energy' | 'counter' | 'other'

function categorizeTelemetry(i: any): TelemetryGroup {
  const key: string = (i?.key || '').toLowerCase()
  if (!key) return 'other'
  // 状态/位/字（开关量、模式字、运行字、保护字）
  if (
    key.includes('_di') ||
    key.includes('protect_status') ||
    key.includes('mode_word') ||
    key.includes('run_status')
  ) {
    return 'status'
  }
  // 电能（累积量）
  if (key.includes('energy')) return 'energy'
  // 计数
  if (key.endsWith('count')) return 'counter'
  // 温度
  if (key.includes('temp')) return 'temp'
  // 电气模拟量（电流/电压/不平衡度）
  if (
    key.includes('current') ||
    key.includes('voltage') ||
    key.includes('unbalance')
  ) {
    return 'analog'
  }
  return 'other'
}

const groupedTelemetry = computed(() => {
  const groups: Record<TelemetryGroup, any[]> = {
    temp: [],
    analog: [],
    status: [],
    energy: [],
    counter: [],
    other: []
  }
  for (const it of telemetryData.value || []) {
    groups[categorizeTelemetry(it)].push(it)
  }
  return groups
})
</script>

<template>
  <n-card class="w-full">
    <!-- 第一行 -->
    <NFlex justify="space-between">
      <n-button type="primary" class="mb-4" @click="openDialog">{{ $t('generate.issue-control') }}</n-button>

      <n-button v-if="showLog" type="primary" class="mb-4" @click="openUpLog">
        {{ $t('generate.simulate-report-data') }}
      </n-button>
    </NFlex>

    <!-- 自定义控制 -->
    <NGrid x-gap="20" y-gap="20" cols="1 s:2 m:3 l:4" responsive="screen" class="mb-4">
      <NGridItem v-for="item in controlList" :key="item.id">
        <NCard hoverable>
          <div class="title cursor-pointer ellipsis-text text-16px font-600" @click="onControlChange(item)">
            {{ item.name }}
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 第二行：遥测指标卡（按语义分组，业界电力监控 / SCADA 通用分类） -->
    <TempGroup v-if="groupedTelemetry.temp.length" :items="groupedTelemetry.temp" :spark-buffer="sparkBuffer" />
    <AnalogGroup
      v-if="groupedTelemetry.analog.length"
      :items="groupedTelemetry.analog"
      :spark-buffer="sparkBuffer"
    />
    <StatusGroup v-if="groupedTelemetry.status.length" :items="groupedTelemetry.status" />
    <EnergyGroup
      v-if="groupedTelemetry.energy.length"
      :items="groupedTelemetry.energy"
      :spark-buffer="sparkBuffer"
    />
    <CounterGroup
      v-if="groupedTelemetry.counter.length"
      :items="groupedTelemetry.counter"
      :spark-buffer="sparkBuffer"
    />
    <OtherGroup
      v-if="groupedTelemetry.other.length"
      :items="groupedTelemetry.other"
      :spark-buffer="sparkBuffer"
      :status-tag-type="statusTagType"
      :status-label="statusLabel"
      :metric-card-class="metricCardClass"
      :is-color="isColor"
    />

    <!-- 第三行 -->
    <n-space>
      <n-select
        v-model:value="operationType"
        :options="operationOptions"
        style="width: 200px"
        @update:value="fetchData"
      />
      <n-select v-model:value="sendResult" :options="resultOptions" style="width: 200px" @update:value="fetchData" />
    </n-space>

    <!-- 第四行 -->

    <n-data-table :loading="loading" class="mt-4" :columns="columns" :data="tableData" :pagination="false" />
    <div class="mt-4 w-full flex justify-end">
      <n-pagination
        :page-count="total"
        :page-size="5"
        @update:page="
          page => {
            log_page = page
            fetchData()
          }
        "
      />
    </div>
    <n-modal v-model:show="showLogDialog" :title="$t('generate.report-data')" :class="getPlatform ? 'w-90%' : 'w-40%'">
      <n-card>
        <n-form>
          <div class="m-b-20px" :class="getPlatform ? ' flex-col ' : ' flex'">
            <span class="flex-1">{{ $t('generate.mqtt') }}</span>
            <span class="flex-1">{{ $t('generate.copy-commands-to-local') }}</span>
          </div>
          <div class="flex items-center gap-15px">
            <n-input v-model:value="device_order" type="textarea" class="flex-1" @click="copy" />

            <n-button type="primary" @click="sendSimulationList">
              {{ $t('generate.send') }}
            </n-button>
          </div>
          <div v-if="showError" class="w-100% flex" style="border: 2px solid #eee; border-radius: 5px">
            <SvgIcon
              local-icon="AlertFilled"
              style="margin-left: 5px; color: red; margin-right: 5px; margin-top: 5px; margin-bottom: 5px"
              class="text-20px text-primary"
            />
            <span
              style="
                display: inline-block;
                margin-top: 5px;
                margin-bottom: 5px;
                width: 300px;
                wite-space: nowrap;
                overflow: hidden;
                overflow: hidden;
                text-overflow: ellipsis;
              "
            >
              {{ erroMessage }}99999
            </span>
          </div>
        </n-form>
      </n-card>
    </n-modal>
    <n-modal v-model:show="showDialog" :class="getPlatform ? 'w-90%' : 'w-40%'">
      <n-card :title="$t('generate.distributeControlToDevice')">
        <n-form label-placement="left">
          <div class="flex">
            <n-form-item>
              <template #label>
                <div class="flex-ai-c flex">
                  {{ $t('generate.expectedMessage') }}
                  <n-popover trigger="hover">
                    <template #trigger>
                      <svg
                        style="width: 20px"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        viewBox="0 0 20 20"
                      >
                        <g fill="none">
                          <path
                            d="M10 2a8 8 0 1 1-3.613 15.14l-.121-.065l-3.645.91a.5.5 0 0 1-.62-.441v-.082l.014-.083l.91-3.644l-.063-.12a7.95 7.95 0 0 1-.83-2.887l-.025-.382L2 10a8 8 0 0 1 8-8zm0 1a7 7 0 0 0-6.106 10.425a.5.5 0 0 1 .063.272l-.014.094l-.756 3.021l3.024-.754a.502.502 0 0 1 .188-.01l.091.021l.087.039A7 7 0 1 0 10 3zm0 2.5a.5.5 0 0 1 .5.5v5.5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm0 9a.75.75 0 1 0 0-1.5a.75.75 0 0 0 0 1.5z"
                            fill="currentColor"
                          ></path>
                        </g>
                      </svg>
                    </template>
                    <span>{{ $t('generate.expectedMessageTip') }}</span>
                  </n-popover>
                </div>
              </template>

              <n-switch v-model:value="form.expected" />
            </n-form-item>
            <n-form-item v-if="form.expected" :label="$t('generate.expirationTime')" class="ml-20px">
              <div class="flex-ai-c flex">
                <n-input-number v-model:value="form.time" :show-button="false" class="w-80px" />
                <div class="fs-0">{{ $t('generate.hour') }}</div>
              </div>
            </n-form-item>
          </div>
          <n-form-item label="" :validation-status="validationJson" :feedback="inputFeedback">
            <n-input v-model:value="formValue" type="textarea" />
          </n-form-item>
          <n-space align="end">
            <n-button @click="showDialog = false">{{ $t('generate.cancel') }}</n-button>

            <n-popconfirm @positive-click="handlePositiveClick">
              <template #trigger>
                <n-button type="primary" :disabled="!formValue || validationJson === 'error'">
                  {{ $t('generate.send') }}
                </n-button>
              </template>
              确定发送指令吗
            </n-popconfirm>
          </n-space>
        </n-form>
      </n-card>
    </n-modal>
    <n-modal v-model:show="showHistory" :title="$t('generate.telemetry-history-data')">
      <NCard style="width: 80%">
        <HistoryData
          v-if="modelType === $t('custom.device_details.history')"
          :device-id="telemetryId"
          :the-key="telemetryKey"
          :the-name="telemetryName"
          :the-unit="telemetryUnit"
        />
        <TimeSeriesData
          v-if="modelType === $t('custom.device_details.sequential')"
          :device-id="telemetryId"
          :the-key="telemetryKey"
          :the-name="telemetryName"
          :the-unit="telemetryUnit"
        />
      </NCard>
    </n-modal>
  </n-card>
</template>

<style lang="scss" oped>
.line1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  span {
    &:nth-child(2) {
      color: #ccc;
      padding-left: 5px;
    }
  }
}

.card-body {
  padding: 10px 0 10px;
  display: flex;
  align-items: end;
  gap: 4px;

  span {
    &:first-child {
      font-size: 32px;
      line-height: 1;
    }
  }
}
.ml-20px {
  margin-left: 20px;
}
.flex-ai-c {
  align-items: center;
}
.w-80px {
  width: 80px;
}
.fs-0 {
  flex-shrink: 0;
}
.chart-table-dialog {
  width: 80%;
  max-width: 1000px;
}

.value-display-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all; /* Or 'break-word' if preferred */
}

/* ============================================================
 * 遥测卡片值/标题显示优化（设备详情·遥测 Tab）
 *  - .value-bits / .value-bit*  : 位字段（如 DI 状态）渲染为位标签
 *  - .value-hex                 : DL/T 645 原始 hex（raw_data）分组 + mono 字体
 *  - .value-empty / .value-text : 空值占位 / 通用字符串
 *  - .value-unit                : 单位后缀（kWh, °C）
 *  - .line1-unknown / .line1-key: 未命名点位标题降级
 * ============================================================ */
.value-bits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  max-height: 88px;
  overflow-y: auto;
  align-items: center;
  font-size: 13px;
  line-height: 1.3;
}
.value-bit {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  background: #fafafa;
  white-space: nowrap;
}
.value-bit-k {
  font-style: normal;
  color: #888;
  font-size: 12px;
}
.value-bit-v {
  font-weight: 600;
  font-size: 13px;
  padding: 0 4px;
  border-radius: 3px;
}
.value-bit-v.is-on {
  color: #18a058;
  background: #ebf8f1;
}
.value-bit-v.is-off {
  color: #999;
  background: #f0f0f0;
}
.value-bit-v.is-text {
  color: #555;
  background: transparent;
}

.value-hex {
  display: block;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
  color: #444;
  background: #f8f8f8;
  border: 1px solid #eaeaea;
  padding: 4px 8px;
  border-radius: 4px;
  max-height: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1 1 auto;
  min-width: 0;
}
.value-tooltip-body {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  margin: 0;
  max-width: 360px;
  white-space: pre-wrap;
  word-break: break-all;
}

.value-empty {
  font-size: 28px;
  color: #c8c8cc;
  font-weight: 300;
  line-height: 1;
}
.value-text {
  font-size: 18px;
  word-break: break-all;
  color: #333;
}
.value-unit {
  color: #999;
  font-size: 13px;
  margin-left: 4px;
  font-weight: 500;
}

.line1-unknown {
  color: #909399;
  font-weight: 500;
}
.line1-key {
  color: #c0c4cc;
  padding-left: 5px;
}

/* ============================================================
 * 仪表盘风格指标卡（设备详情·遥测 Tab）
 *  - .metric-card        : 卡片容器（替代原「卡中卡」n-card）
 *  - .metric-head/title  : 标题 + 状态徽章
 *  - .metric-value-row   : 数值行（数值型含变化%，非数值型走 value-* 类）
 *  - .metric-spark       : sparkline 区域（仅数值型）
 *  - .metric-foot        : 相对时间 + 操作图标
 * ============================================================ */
.metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 168px;
  padding: 14px 16px;
  border: 1px solid #eceef2;
  border-radius: 10px;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s, opacity 0.2s;

  &:hover {
    border-color: rgb(var(--primary-color));
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }
}
.metric-card--offline {
  opacity: 0.72;
}
.metric-card--nodata {
  opacity: 0.55;
}

.metric-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.metric-title {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}
.metric-label {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.metric-label--unknown {
  color: #909399;
  font-weight: 500;
}
.metric-key {
  font-size: 12px;
  color: #c0c4cc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.metric-badge {
  flex-shrink: 0;
  font-size: 12px;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 40px;
}
.metric-num {
  font-size: 30px;
  line-height: 1.1;
  font-weight: 600;
  color: #1d2129;
  display: flex;
  align-items: baseline;
}
.metric-delta {
  font-size: 12px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
.metric-delta--up {
  color: #e0504a;
  background: #fdecea;
}
.metric-delta--down {
  color: #18a058;
  background: #ebf8f1;
}
.metric-delta--flat {
  color: #909399;
  background: #f4f4f5;
}

.metric-spark {
  margin-top: 2px;
  min-height: 32px;
}

.metric-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px dashed #f0f1f3;
}
.metric-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.metric-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.metric-action-icon {
  cursor: pointer;
  color: #86909c;
  transition: color 0.2s;

  &:hover {
    color: rgb(var(--primary-color));
  }
}
.metric-action-dots {
  width: 18px;
  height: 18px;
  cursor: pointer;
  color: #86909c;
  transition: color 0.2s;

  &:hover {
    color: rgb(var(--primary-color));
  }
}
</style>
