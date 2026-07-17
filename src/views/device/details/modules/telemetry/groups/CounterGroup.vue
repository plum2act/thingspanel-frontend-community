<template>
  <section class="group group--counter">
    <header class="group-head">
      <div class="group-icon"><NIcon size="18"><Calculator /></NIcon></div>
      <h3 class="group-title">计数</h3>
      <span class="group-count">{{ items.length }} 项</span>
    </header>

    <div class="group-body">
      <div v-for="it in items" :key="it.key" class="counter-card">
        <div class="counter-card__title">{{ it.label || it.key }}</div>
        <div class="counter-card__value-row">
          <span class="counter-card__num">{{ formatNum(it.value) }}</span>
          <span v-if="it.unit" class="counter-card__unit">{{ it.unit }}</span>
        </div>
        <div class="counter-card__delta">
          <span class="counter-card__delta-label">本周期增量</span>
          <span class="counter-card__delta-value" :class="deltaClass(it)">
            {{ deltaText(it) }}
          </span>
        </div>
        <div class="counter-card__foot">
          <span class="counter-card__ts">{{ formatRelativeTime(it.ts) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="tsx">
import { Calculator } from '@vicons/tabler'
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

function deltaText(it: Item): string {
  const buf = props.sparkBuffer[it.key] || []
  if (buf.length < 2) return '·'
  const last = buf[buf.length - 1].value
  const prev = buf[buf.length - 2].value
  const d = last - prev
  if (d === 0) return '±0'
  if (d > 0) return `+${d}`
  return `${d}`
}

function deltaClass(it: Item): string {
  const buf = props.sparkBuffer[it.key] || []
  if (buf.length < 2) return ''
  const last = buf[buf.length - 1].value
  const prev = buf[buf.length - 2].value
  if (last > prev) return 'counter-card__delta-value--up'
  if (last < prev) return 'counter-card__delta-value--down'
  return 'counter-card__delta-value--flat'
}

function formatNum(v: any): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '--'
  return n.toLocaleString('zh-CN')
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
  background: linear-gradient(135deg, #eb2f96 0%, #722ed1 100%);
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.counter-card {
  padding: 14px 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e8eaef;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.18s ease;
}
.counter-card:hover {
  box-shadow: 0 4px 14px rgba(235, 47, 150, 0.12);
}

.counter-card__title {
  font-size: 12px;
  color: #777;
  font-weight: 500;
}
.counter-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.counter-card__num {
  font-size: 32px;
  font-weight: 700;
  color: #1f1f1f;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.counter-card__unit {
  font-size: 13px;
  color: #888;
}
.counter-card__delta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.counter-card__delta-label {
  color: #999;
}
.counter-card__delta-value {
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 10px;
}
.counter-card__delta-value--up {
  color: #cf1322;
  background: #fff1f0;
}
.counter-card__delta-value--down {
  color: #389e0d;
  background: #f6ffed;
}
.counter-card__delta-value--flat {
  color: #999;
  background: #f5f5f5;
}
.counter-card__foot {
  font-size: 11px;
  color: #999;
}
</style>