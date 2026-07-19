<template>
  <section class="group group--analog">
    <header class="group-head">
      <div class="group-icon"><NIcon size="18"><ChartLine /></NIcon></div>
      <h3 class="group-title">电气模拟量</h3>
      <span class="group-count">{{ items.length }} 项</span>
    </header>

    <div class="group-body">
      <div
        v-for="it in items"
        :key="it.key"
        class="analog-card"
        :class="typeof it.value === 'number' ? 'is-clickable' : ''"
        :title="typeof it.value === 'number' ? '查看趋势' : undefined"
        @click="onCardClick(it)"
      >
        <div class="analog-card__title">{{ it.label || it.key }}</div>

        <div class="analog-card__ring-wrap">
          <svg class="analog-card__ring" :viewBox="`0 0 ${SIZE} ${SIZE}`">
            <circle
              :cx="CENTER"
              :cy="CENTER"
              :r="RADIUS"
              fill="none"
              stroke="#f0f0f0"
              :stroke-width="STROKE"
            />
            <circle
              :cx="CENTER"
              :cy="CENTER"
              :r="RADIUS"
              fill="none"
              :stroke="ringColor(it)"
              :stroke-width="STROKE"
              stroke-linecap="round"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="dashOffset(it)"
              :transform="`rotate(-90 ${CENTER} ${CENTER})`"
              class="analog-card__ring-progress"
            />
          </svg>
          <div class="analog-card__center">
            <div class="analog-card__num">{{ formatNum(it.value) }}</div>
            <div class="analog-card__unit">{{ it.unit || '' }}</div>
          </div>
        </div>

        <SparkLine :points="sparkBuffer[it.key] || []" class="analog-card__spark" />

        <div class="analog-card__foot">
          <span class="analog-card__pct">{{ ringPercent(it).toFixed(0) }}% 量程</span>
          <span class="analog-card__ts">{{ formatRelativeTime(it.ts) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="tsx">
import { ChartLine } from '@vicons/tabler'
import SparkLine from '../modules/SparkLine.vue'
import { formatRelativeTime } from '@/utils/common/datetime'

interface Item {
  key: string
  value: number | string
  label?: string
  unit?: string
  ts?: string | number
}

const props = defineProps<{
  items: Item[]
  sparkBuffer: Record<string, Array<{ ts: number; value: number }>>
}>()

const emit = defineEmits<{ (e: 'view-history', item: Item): void }>()

function onCardClick(it: Item) {
  if (typeof it.value !== 'number') return
  emit('view-history', it)
}

// 量程映射（按典型工程范围，可调）
const RANGE_MAP: Record<string, [number, number, string]> = {
  mccb_zero_seq_current: [0, 5, 'A'],
  mccb_residual_current: [0, 2, 'A'],
  mccb_zero_seq_voltage: [0, 50, 'V'],
  mccb_voltage_unbalance: [0, 1, '%'],
  mccb_current_unbalance: [0, 1, '%']
}
const DEFAULT_RANGE: [number, number] = [0, 100]

const SIZE = 110
const CENTER = SIZE / 2
const RADIUS = 46
const STROKE = 8
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function rangeFor(it: Item): [number, number] {
  return RANGE_MAP[it.key] || DEFAULT_RANGE
}

function ringPercent(it: Item): number {
  const v = Number(it.value)
  if (Number.isNaN(v)) return 0
  const [min, max] = rangeFor(it)
  const pct = ((v - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, pct))
}

function dashOffset(it: Item): number {
  return CIRCUMFERENCE * (1 - ringPercent(it) / 100)
}

// 颜色：低段绿 / 中段蓝 / 高段橙 / 超量程红
function ringColor(it: Item): string {
  const pct = ringPercent(it)
  if (pct >= 100) return '#f5222d'
  if (pct >= 75) return '#faad14'
  if (pct >= 30) return '#1890ff'
  return '#52c41a'
}

function formatNum(v: any): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '--'
  if (Math.abs(n) >= 100) return n.toFixed(1)
  if (Math.abs(n) >= 10) return n.toFixed(2)
  return n.toFixed(3)
}
</script>

<style lang="scss" scoped>
.group {
  margin-bottom: 24px;
}
.group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.group-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, #722ed1 0%, #1890ff 100%);
  color: #fff;
}
.group-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.group-count {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.group-body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
}

.analog-card {
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e8eaef;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: box-shadow 0.18s ease;
}
.analog-card:hover {
  box-shadow: 0 4px 14px rgba(114, 46, 209, 0.12);
}

.analog-card__title {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  align-self: flex-start;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.analog-card__ring-wrap {
  position: relative;
  width: 110px;
  height: 110px;
}
.analog-card__ring {
  width: 100%;
  height: 100%;
}
.analog-card__ring-progress {
  transition: stroke-dashoffset 0.4s ease, stroke 0.3s ease;
}
.analog-card__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.analog-card__num {
  font-size: 22px;
  font-weight: 600;
  color: #1f1f1f;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.analog-card__unit {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}
.analog-card__spark {
  height: 28px;
  width: 100%;
}
.analog-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
  width: 100%;
}

.analog-card.is-clickable {
  cursor: pointer;
}
</style>