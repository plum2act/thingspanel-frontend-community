<template>
  <section class="group group--energy">
    <header class="group-head">
      <div class="group-icon"><NIcon size="18"><Bolt /></NIcon></div>
      <h3 class="group-title">电能</h3>
      <span class="group-count">{{ items.length }} 项</span>
    </header>

    <div class="group-body">
      <div v-for="it in items" :key="it.key" class="energy-card">
        <div class="energy-card__head">
          <span class="energy-card__title">{{ it.label || it.key }}</span>
          <span class="energy-card__trend" :class="trendClass(it)">
            <NIcon size="14"><TrendingUp v-if="isMonotonic(it)" /><Minus v-else /></NIcon>
            <span>{{ deltaPerTick(it) }}</span>
          </span>
        </div>

        <div class="energy-card__value">
          <span class="energy-card__num">{{ formatNum(it.value) }}</span>
          <span class="energy-card__unit">{{ it.unit || 'kWh' }}</span>
        </div>

        <div class="energy-card__spark-wrap">
          <SparkLine :points="sparkBuffer[it.key] || []" />
        </div>

        <div class="energy-card__foot">
          <span class="energy-card__trend-label">累计递增</span>
          <span class="energy-card__ts">{{ formatRelativeTime(it.ts) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="tsx">
import { Bolt, TrendingUp, Minus } from '@vicons/tabler'
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

function isMonotonic(it: Item): boolean {
  const buf = props.sparkBuffer[it.key] || []
  if (buf.length < 2) return true
  // 取最近 6 个点判断单调性（电能累积曲线通常单调递增）
  const recent = buf.slice(-6)
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].value < recent[i - 1].value - 0.001) return false
  }
  return true
}

function deltaPerTick(it: Item): string {
  const buf = props.sparkBuffer[it.key] || []
  if (buf.length < 2) return '--'
  const last = buf[buf.length - 1].value
  const prev = buf[buf.length - 2].value
  const d = last - prev
  if (Math.abs(d) < 0.001) return '0'
  return `+${d.toFixed(2)}`
}

function trendClass(it: Item): string {
  return isMonotonic(it) ? 'energy-card__trend--up' : 'energy-card__trend--flat'
}

function formatNum(v: any): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '--'
  return n.toFixed(2)
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
  background: linear-gradient(135deg, #faad14 0%, #fa8c16 100%);
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.energy-card {
  padding: 14px 18px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fffbe6 0%, #fff 60%);
  border: 1px solid #ffe58f;
  border-left: 4px solid #faad14;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.18s ease;
}
.energy-card:hover {
  box-shadow: 0 4px 14px rgba(250, 173, 20, 0.18);
}

.energy-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.energy-card__title {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}
.energy-card__trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}
.energy-card__trend--up {
  color: #d48806;
  background: #fff7e6;
}
.energy-card__trend--flat {
  color: #999;
  background: #f5f5f5;
}

.energy-card__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.energy-card__num {
  font-size: 36px;
  font-weight: 700;
  color: #1f1f1f;
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  background: linear-gradient(90deg, #d48806 0%, #fa8c16 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.energy-card__unit {
  font-size: 16px;
  color: #888;
  font-weight: 500;
}

.energy-card__spark-wrap {
  height: 40px;
}

.energy-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}
.energy-card__trend-label {
  color: #d48806;
  font-weight: 500;
}
</style>