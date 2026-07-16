<script setup lang="tsx">
import { computed, getCurrentInstance, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useIntervalFn, useWebSocket } from '@vueuse/core'
import { MovingNumbers } from 'moving-numbers-vue3'
import moment from 'moment'
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
import { formatRelativeTime } from '@/utils/common/datetime'
import { useLoading } from '~/packages/hooks'
import { useTheme } from '@/components/ux/useTheme'
import UxSection from '@/components/ux/UxSection.vue'
import UxStatusBadge from '@/components/ux/UxStatusBadge.vue'
import UxSparkline from '@/components/ux/UxSparkline.vue'
import UxGaugeRing from '@/components/ux/UxGaugeRing.vue'
import UxLedBit from '@/components/ux/UxLedBit.vue'

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
const { loading, startLoading, endLoading } = useLoading()
const total = ref(0)
const showLog = ref(false)
const device_order = ref('')
const operationOptions = [
  { label: $t('custom.device_details.whole'), value: '' },
  { label: $t('custom.device_details.manualOperation'), value: '1' },
  { label: $t('custom.device_details.triggerOperation'), value: '2' }
]
const resultOptions = [
  { label: $t('custom.device_details.whole'), value: '' },
  { label: $t('custom.devicePage.success'), value: '1' },
  { label: $t('custom.devicePage.fail'), value: '2' }
]
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

      // 累积 sparkline 实时数据
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
    const preheatTs = Date.now()
    data.forEach((item: any) => {
      pushSpark(item.key, item.value, item.ts ? dayjs(item.ts).valueOf() : preheatTs)
    })
    initTelemetryData.value = data[0] || {}
    initTelemetryData.value.device_id = props.id
    const dataw = {
      device_id: props.id,
      token
    }

    send(JSON.stringify(dataw))
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
      const expiry = new Date().getTime() + (form.time ? form.time * 60 * 60 * 1000 : 0)
      res = await expectMessageAdd({
        device_id: props.id,
        payload: formValue.value,
        send_type: 'telemetry',
        expiry: moment(expiry).format('YYYY-MM-DDTHH:mm:ssZ')
      })
    } else {
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
// 仪表盘风格：sparkline 累积缓冲 + 变化% + 状态徽章 + tick
// ================================================================
const SPARK_MAX = 30

const sparkBuffer = ref<Record<string, Array<{ ts: number; value: number }>>>({})

function pushSpark(key: string, value: unknown, ts: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return
  const prev = sparkBuffer.value[key] || []
  const next = [...prev, { ts, value }]
  while (next.length > SPARK_MAX) next.shift()
  sparkBuffer.value = { ...sparkBuffer.value, [key]: next }
}

const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000
const tick = ref(0)
const { pause: pauseTick } = useIntervalFn(
  () => {
    tick.value++
  },
  30 * 1000
)

type MetricStatus = 'online' | 'offline' | 'no-data'

function getStatus(i: any): MetricStatus {
  void tick.value
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

function statusBadgeType(i: any): 'online' | 'offline' | 'warn' {
  const s = getStatus(i)
  if (s === 'online') return 'online'
  if (s === 'offline') return 'offline'
  return 'warn'
}

function metricCardClass(i: any): string {
  const s = getStatus(i)
  if (s === 'offline') return 'ux-other-card--offline'
  if (s === 'no-data') return 'ux-other-card--nodata'
  return ''
}

// ================================================================
// 主题 + 三相颜色（UxPalette 引用）
// ================================================================
const { palette } = useTheme()
const phaseColors = computed(() => [palette.value.phaseA, palette.value.phaseB, palette.value.phaseC])
function phaseColor(idx: number) {
  return phaseColors.value[idx] || palette.value.primary
}

// ================================================================
// 温度分级
// ================================================================
function tempLevel(v: any): 'cold' | 'normal' | 'warm' | 'hot' {
  const t = Number(v)
  if (Number.isNaN(t)) return 'normal'
  if (t < 32) return 'cold'
  if (t < 40) return 'normal'
  if (t < 50) return 'warm'
  return 'hot'
}

function tempBadgeText(it: any): string {
  switch (tempLevel(it.value)) {
    case 'cold':
      return '低温'
    case 'warm':
      return '偏高'
    case 'hot':
      return '高温'
    default:
      return '正常'
  }
}

function tempBadgeType(it: any): 'info' | 'success' | 'warning' | 'error' {
  switch (tempLevel(it.value)) {
    case 'cold':
      return 'info'
    case 'warm':
      return 'warning'
    case 'hot':
      return 'error'
    default:
      return 'success'
  }
}

// ================================================================
// 模拟量范围 + 颜色
// ================================================================
const RANGE_MAP: Record<string, [number, number]> = {
  mccb_zero_seq_current: [0, 5],
  mccb_residual_current: [0, 2],
  mccb_zero_seq_voltage: [0, 50],
  mccb_voltage_unbalance: [0, 1],
  mccb_current_unbalance: [0, 1]
}
const DEFAULT_RANGE: [number, number] = [0, 100]

function rangeFor(it: any): [number, number] {
  return RANGE_MAP[it.key] || DEFAULT_RANGE
}

function rangePercent(it: any): number {
  const v = Number(it.value)
  if (Number.isNaN(v)) return 0
  const [min, max] = rangeFor(it)
  const pct = (v - min) / (max - min)
  return Math.max(0, Math.min(1, pct))
}

function rangeColor(it: any): string {
  const pct = rangePercent(it)
  if (pct >= 0.95) return palette.value.danger
  if (pct >= 0.8) return palette.value.warning
  if (pct >= 0.5) return palette.value.info
  return palette.value.success
}

// ================================================================
// 状态字位解析
// ================================================================
const BIT_LABELS: Record<string, string[]> = {
  mccb_di1_status: ['DI1', 'DI2', 'DI3', 'DI4'],
  mccb_di2_status: ['DI1', 'DI2', 'DI3', 'DI4'],
  mccb_di3_status: ['DI1', 'DI2', 'DI3', 'DI4'],
  mccb_di4_status: ['DI1', 'DI2', 'DI3', 'DI4']
}
const DEFAULT_BIT_LABELS = ['bit0', 'bit1', 'bit2', 'bit3', 'bit4', 'bit5', 'bit6', 'bit7']

function parseValue(v: any): number {
  if (typeof v === 'number') return v & 0xff
  if (typeof v === 'string') {
    try {
      const j = JSON.parse(v)
      if (typeof j === 'object' && j !== null) {
        let n = 0
        for (let i = 0; i < 8; i++) {
          if (j[`bit${i}`]) n |= 1 << i
        }
        return n
      }
    } catch {
      // not JSON
    }
    const m = v.match(/0x([0-9a-fA-F]+)/)
    if (m) return parseInt(m[1], 16) & 0xff
    const n = parseInt(v, 16)
    if (!Number.isNaN(n)) return n & 0xff
  }
  return 0
}

function bitInfo(it: any): { bits: Array<{ idx: number; label: string; on: boolean }> } {
  const n = parseValue(it.value)
  const labels = BIT_LABELS[it.key] || DEFAULT_BIT_LABELS
  let highBit = 3
  for (let i = 7; i >= 0; i--) {
    if (n & (1 << i)) {
      highBit = i
      break
    }
  }
  const bitCount = Math.min(8, Math.max(4, highBit + 1))
  const bits: Array<{ idx: number; label: string; on: boolean }> = []
  for (let i = 0; i < bitCount; i++) {
    bits.push({ idx: i, label: labels[i] || `bit${i}`, on: Boolean(n & (1 << i)) })
  }
  return { bits }
}

function formatHex(v: any): string {
  const n = parseValue(v)
  return n.toString(16).toUpperCase().padStart(2, '0')
}

// ================================================================
// 电能单调性
// ================================================================
function isMonotonic(it: any): boolean {
  const buf = sparkBuffer.value[it.key] || []
  if (buf.length < 2) return true
  const recent = buf.slice(-6)
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].value < recent[i - 1].value - 0.001) return false
  }
  return true
}

function deltaPerTick(it: any): string {
  const buf = sparkBuffer.value[it.key] || []
  if (buf.length < 2) return '--'
  const last = buf[buf.length - 1].value
  const prev = buf[buf.length - 2].value
  const d = last - prev
  if (Math.abs(d) < 0.001) return '0'
  return `${d >= 0 ? '+' : ''}${d.toFixed(2)}`
}

// ================================================================
// 计数器 delta
// ================================================================
function counterDeltaText(it: any): string {
  const buf = sparkBuffer.value[it.key] || []
  if (buf.length < 2) return '·'
  const last = buf[buf.length - 1].value
  const prev = buf[buf.length - 2].value
  const d = last - prev
  if (d === 0) return '±0'
  if (d > 0) return `+${d}`
  return `${d}`
}

function counterDeltaClass(it: any): string {
  const buf = sparkBuffer.value[it.key] || []
  if (buf.length < 2) return ''
  const last = buf[buf.length - 1].value
  const prev = buf[buf.length - 2].value
  if (last > prev) return 'ux-counter-card__delta-value--up'
  if (last < prev) return 'ux-counter-card__delta-value--down'
  return 'ux-counter-card__delta-value--flat'
}

// ================================================================
// 数值格式化
// ================================================================
function formatTemp(v: any): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '--'
  return n.toFixed(1)
}

function formatEnergy(v: any): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '--'
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function formatCounter(v: any): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '--'
  return n.toLocaleString('zh-CN')
}

function formatAnalog(v: any): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '--'
  if (Math.abs(n) >= 100) return n.toFixed(1)
  if (Math.abs(n) >= 10) return n.toFixed(2)
  return n.toFixed(3)
}

// ================================================================
// 遥测指标按语义分组
// ================================================================
type TelemetryGroup = 'temp' | 'analog' | 'status' | 'energy' | 'counter' | 'other'

function categorizeTelemetry(i: any): TelemetryGroup {
  const key: string = (i?.key || '').toLowerCase()
  if (!key) return 'other'
  if (
    key.includes('_di') ||
    key.includes('protect_status') ||
    key.includes('mode_word') ||
    key.includes('run_status')
  ) {
    return 'status'
  }
  if (key.includes('energy')) return 'energy'
  if (key.endsWith('count')) return 'counter'
  if (key.includes('temp')) return 'temp'
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
    <NFlex justify="space-between">
      <n-button type="primary" class="mb-4" @click="openDialog">{{ $t('generate.issue-control') }}</n-button>

      <n-button v-if="showLog" type="primary" class="mb-4" @click="openUpLog">
        {{ $t('generate.simulate-report-data') }}
      </n-button>
    </NFlex>

    <NGrid x-gap="20" y-gap="20" cols="1 s:2 m:3 l:4" responsive="screen" class="mb-4">
      <NGridItem v-for="item in controlList" :key="item.id">
        <NCard hoverable>
          <div class="title cursor-pointer ellipsis-text text-16px font-600" @click="onControlChange(item)">
            {{ item.name }}
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 三相温度 -->
    <UxSection
      v-if="groupedTelemetry.temp.length"
      title="三相温度"
      icon="🌡"
      :count="groupedTelemetry.temp.length"
      :icon-color="palette.danger"
    >
      <div class="ux-phase-grid">
        <div
          v-for="(it, idx) in groupedTelemetry.temp"
          :key="it.key"
          class="ux-phase-card"
          :style="{ background: palette.bg1, borderColor: phaseColor(idx) + '40' }"
        >
          <div class="ux-phase-card__head">
            <span class="ux-phase-card__phase" :style="{ background: phaseColor(idx) }">
              {{ ['A', 'B', 'C'][idx] || `相${idx + 1}` }}
            </span>
            <span class="ux-phase-card__label">{{ it.label || it.key }}</span>
            <span
              class="ux-phase-card__level"
              :style="{ color: phaseColor(idx), background: phaseColor(idx) + '15' }"
            >
              {{ tempBadgeText(it) }}
            </span>
          </div>
          <div class="ux-phase-card__value-row">
            <span class="ux-phase-card__num" :style="{ color: phaseColor(idx) }">{{ formatTemp(it.value) }}</span>
            <span class="ux-phase-card__unit">{{ it.unit || '℃' }}</span>
          </div>
          <div class="ux-phase-card__spark">
            <UxSparkline :points="sparkBuffer[it.key] || []" :color="phaseColor(idx)" :fill="phaseColor(idx) + '20'" :height="32" />
          </div>
          <div class="ux-phase-card__foot">
            <n-tag :type="tempBadgeType(it)" size="small" round :bordered="false">{{ tempBadgeText(it) }}</n-tag>
            <span class="ux-phase-card__ts">{{ formatRelativeTime(it.ts) }}</span>
          </div>
        </div>
      </div>
    </UxSection>

    <!-- 电气模拟量 -->
    <UxSection
      v-if="groupedTelemetry.analog.length"
      title="电流 / 电压 / 不平衡"
      icon="∿"
      :count="groupedTelemetry.analog.length"
      :icon-color="palette.info"
    >
      <div class="ux-analog-grid">
        <div
          v-for="it in groupedTelemetry.analog"
          :key="it.key"
          class="ux-analog-card"
          :style="{ background: palette.bg1, borderColor: palette.border1 }"
        >
          <UxGaugeRing :percent="rangePercent(it)" :color="rangeColor(it)" :size="92" :stroke-width="9" />
          <div class="ux-analog-card__meta">
            <div class="ux-analog-card__label">{{ it.label || it.key }}</div>
            <div class="ux-analog-card__value-row">
              <span class="ux-analog-card__num">{{ formatAnalog(it.value) }}</span>
              <span class="ux-analog-card__unit">{{ it.unit || '' }}</span>
            </div>
            <div class="ux-analog-card__range" :style="{ color: palette.text3 }">
              范围 {{ rangeFor(it)[0] }} ~ {{ rangeFor(it)[1] }}{{ it.unit || '' }}
            </div>
            <div class="ux-analog-card__spark">
              <UxSparkline :points="sparkBuffer[it.key] || []" :color="rangeColor(it)" :fill="rangeColor(it) + '20'" :height="32" />
            </div>
          </div>
        </div>
      </div>
    </UxSection>

    <!-- 开关 / 状态字 -->
    <UxSection
      v-if="groupedTelemetry.status.length"
      title="开关 / 状态字"
      icon="◉"
      :count="groupedTelemetry.status.length"
      :icon-color="palette.success"
    >
      <div class="ux-status-grid">
        <div
          v-for="it in groupedTelemetry.status"
          :key="it.key"
          class="ux-status-card"
          :style="{ background: palette.bg1, borderColor: palette.border1 }"
        >
          <div class="ux-status-card__head">
            <span class="ux-status-card__title">{{ it.label || it.key }}</span>
            <code class="ux-status-card__hex">0x{{ formatHex(it.value) }}</code>
          </div>
          <div class="ux-status-card__bits">
            <UxLedBit
              v-for="b in bitInfo(it).bits"
              :key="b.idx"
              :label="b.label"
              :on="b.on"
            />
          </div>
          <div class="ux-status-card__foot" :style="{ color: palette.text3 }">
            <span>{{ formatRelativeTime(it.ts) }}</span>
            <UxStatusBadge :type="statusBadgeType(it)" :text="statusLabel(it)" />
          </div>
        </div>
      </div>
    </UxSection>

    <!-- 电能 -->
    <UxSection
      v-if="groupedTelemetry.energy.length"
      title="电能"
      icon="⚡"
      :count="groupedTelemetry.energy.length"
      :icon-color="palette.warning"
    >
      <div class="ux-energy-grid">
        <div
          v-for="it in groupedTelemetry.energy"
          :key="it.key"
          class="ux-energy-card"
          :style="{ background: palette.bg2, borderColor: palette.warning + '60' }"
        >
          <div class="ux-energy-card__head">
            <span class="ux-energy-card__title">{{ it.label || it.key }}</span>
            <span class="ux-energy-card__trend" :style="{ background: palette.warning + '20', color: palette.warning }">
              {{ isMonotonic(it) ? '↑ 累计递增' : '— 持平' }}
            </span>
          </div>
          <div class="ux-energy-card__num">{{ formatEnergy(it.value) }}</div>
          <div class="ux-energy-card__unit">{{ it.unit || 'kWh' }}</div>
          <div class="ux-energy-card__delta-row">
            <span :style="{ color: palette.text3 }">本周期 {{ deltaPerTick(it) }}</span>
            <UxSparkline :points="sparkBuffer[it.key] || []" :color="palette.warning" :fill="palette.warning + '20'" :height="36" />
          </div>
        </div>
      </div>
    </UxSection>

    <!-- 计数 -->
    <UxSection
      v-if="groupedTelemetry.counter.length"
      title="计数"
      icon="#"
      :count="groupedTelemetry.counter.length"
      :icon-color="palette.danger"
    >
      <div class="ux-counter-grid">
        <div
          v-for="it in groupedTelemetry.counter"
          :key="it.key"
          class="ux-counter-card"
          :style="{ background: palette.bg1, borderColor: palette.border1 }"
        >
          <div class="ux-counter-card__label">{{ it.label || it.key }}</div>
          <div class="ux-counter-card__value-row">
            <span class="ux-counter-card__num">{{ formatCounter(it.value) }}</span>
            <span v-if="it.unit" class="ux-counter-card__unit">{{ it.unit }}</span>
          </div>
          <div class="ux-counter-card__delta">
            <span :style="{ color: palette.text3 }">本周期增量</span>
            <span class="ux-counter-card__delta-value" :class="counterDeltaClass(it)">
              {{ counterDeltaText(it) }}
            </span>
          </div>
          <div class="ux-counter-card__foot" :style="{ color: palette.text3 }">
            <span>{{ formatRelativeTime(it.ts) }}</span>
            <UxStatusBadge :type="statusBadgeType(it)" :text="statusLabel(it)" />
          </div>
        </div>
      </div>
    </UxSection>

    <!-- 其他：保留 MovingNumbers 兜底 -->
    <UxSection
      v-if="groupedTelemetry.other.length"
      title="其他"
      icon="·"
      :count="groupedTelemetry.other.length"
      :icon-color="palette.text3"
    >
      <div class="ux-other-grid">
        <div
          v-for="it in groupedTelemetry.other"
          :key="it.key"
          class="ux-other-card"
          :class="metricCardClass(it)"
          :style="{ background: palette.bg1, borderColor: palette.border1 }"
        >
          <div class="ux-other-card__head">
            <span class="ux-other-card__label">{{ it.label || it.key }}</span>
            <UxStatusBadge :type="statusBadgeType(it)" :text="statusLabel(it)" />
          </div>
          <div class="ux-other-card__value-row">
            <template v-if="isColor(it) === '#cccccc'">
              <MovingNumbers :data-index="it.key" :m-num="it.value || 0" :quantile-show="true" />
              <span v-if="it.unit" class="ux-other-card__unit">{{ it.unit }}</span>
            </template>
            <template v-else>
              <span class="ux-other-card__text">{{ it.value }}</span>
            </template>
          </div>
          <div v-if="isColor(it) === '#cccccc' && sparkBuffer[it.key]?.length" class="ux-other-card__spark">
            <UxSparkline :points="sparkBuffer[it.key] || []" :color="palette.primary" :height="28" />
          </div>
          <div class="ux-other-card__foot" :style="{ color: palette.text3 }">
            <span>{{ formatRelativeTime(it.ts) }}</span>
          </div>
        </div>
      </div>
    </UxSection>

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

<style lang="scss" scoped>
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

/* ============================================================
 * 三相温度卡片（Ux 风格）
 * ============================================================ */
.ux-phase-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 880px) {
  .ux-phase-grid {
    grid-template-columns: 1fr;
  }
}
.ux-phase-card {
  border: 1px solid;
  border-left-width: 4px;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ux-phase-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ux-phase-card__phase {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
}
.ux-phase-card__label {
  font-size: 12px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ux-phase-card__level {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.ux-phase-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ux-phase-card__num {
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.ux-phase-card__unit {
  font-size: 14px;
  opacity: 0.6;
}
.ux-phase-card__spark {
  height: 32px;
}
.ux-phase-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

/* ============================================================
 * 电气模拟量卡片
 * ============================================================ */
.ux-analog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.ux-analog-card {
  border: 1px solid;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  gap: 14px;
  align-items: center;
}
.ux-analog-card__meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ux-analog-card__label {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.85;
}
.ux-analog-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ux-analog-card__num {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.ux-analog-card__unit {
  font-size: 12px;
  opacity: 0.6;
}
.ux-analog-card__range {
  font-size: 11px;
}
.ux-analog-card__spark {
  height: 32px;
}

/* ============================================================
 * 开关 / 状态字
 * ============================================================ */
.ux-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.ux-status-card {
  border: 1px solid;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ux-status-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ux-status-card__title {
  font-weight: 600;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ux-status-card__hex {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 11px;
  opacity: 0.6;
}
.ux-status-card__bits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ux-status-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

/* ============================================================
 * 电能
 * ============================================================ */
.ux-energy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}
.ux-energy-card {
  border: 1px solid;
  border-left-width: 4px;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ux-energy-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ux-energy-card__title {
  font-size: 13px;
  font-weight: 600;
}
.ux-energy-card__trend {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.ux-energy-card__num {
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  background: linear-gradient(90deg, v-bind('palette.warning') 0%, v-bind('palette.danger') 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ux-energy-card__unit {
  font-size: 14px;
  opacity: 0.6;
}
.ux-energy-card__delta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}
.ux-energy-card__delta-row > .ux-sparkline {
  flex: 1;
  min-width: 0;
}

/* ============================================================
 * 计数
 * ============================================================ */
.ux-counter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.ux-counter-card {
  border: 1px solid;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ux-counter-card__label {
  font-size: 12px;
  opacity: 0.75;
}
.ux-counter-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ux-counter-card__num {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.ux-counter-card__unit {
  font-size: 12px;
  opacity: 0.6;
}
.ux-counter-card__delta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.ux-counter-card__delta-value {
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 10px;
  background: #f5f5f5;
  color: #999;
}
.ux-counter-card__delta-value--up {
  color: #cf1322;
  background: #fff1f0;
}
.ux-counter-card__delta-value--down {
  color: #389e0d;
  background: #f6ffed;
}
.ux-counter-card__delta-value--flat {
  color: #999;
  background: #f5f5f5;
}
.ux-counter-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

/* ============================================================
 * 其他（兜底）
 * ============================================================ */
.ux-other-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.ux-other-card {
  padding: 12px 14px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ux-other-card--offline {
  opacity: 0.72;
}
.ux-other-card--nodata {
  opacity: 0.55;
}
.ux-other-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ux-other-card__label {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.ux-other-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ux-other-card__text {
  font-size: 18px;
  color: #333;
  word-break: break-all;
}
.ux-other-card__unit {
  font-size: 12px;
  color: #888;
}
.ux-other-card__spark {
  height: 28px;
}
.ux-other-card__foot {
  font-size: 11px;
}
</style>