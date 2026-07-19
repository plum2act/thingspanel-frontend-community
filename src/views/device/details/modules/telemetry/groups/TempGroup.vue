<template>
  <section class="group group--temp">
    <header class="group-head">
      <div class="group-icon"><NIcon size="18"><Thermometer /></NIcon></div>
      <h3 class="group-title">温度</h3>
      <span class="group-count">{{ items.length }} 项</span>
    </header>

    <div class="group-body">
      <div
        v-for="(it, idx) in items"
        :key="it.key"
        class="temp-card"
        :class="[
          `temp-card--${phaseClass(idx)} temp-card--${tempLevel(it.value)}`,
          typeof it.value === 'number' ? 'is-clickable' : ''
        ]"
        :title="typeof it.value === 'number' ? '查看趋势' : undefined"
        @click="onCardClick(it)"
      >
        <div class="temp-card__phase">{{ phaseLabel(idx) }}</div>
        <div class="temp-card__value">
          <span class="temp-card__num">{{ formatNum(it.value) }}</span>
          <span class="temp-card__unit">℃</span>
        </div>
        <SparkLine :points="sparkBuffer[it.key] || []" class="temp-card__spark" />
        <div class="temp-card__foot">
          <n-tag :type="badgeType(it)" size="small" round :bordered="false">{{ tempBadgeText(it) }}</n-tag>
          <span class="temp-card__ts">{{ formatRelativeTime(it.ts) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="tsx">
import { Thermometer } from '@vicons/tabler'
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

function phaseLabel(idx: number): string {
  return ['A 相', 'B 相', 'C 相'][idx] || `相 ${idx + 1}`
}

function phaseClass(idx: number): string {
  return ['a', 'b', 'c'][idx] || 'x'
}

// 温度分级：< 32 偏冷蓝 / 32-40 正常绿 / 40-50 偏高橙 / > 50 高温红
function tempLevel(v: any): 'cold' | 'normal' | 'warm' | 'hot' {
  const t = Number(v)
  if (Number.isNaN(t)) return 'normal'
  if (t < 32) return 'cold'
  if (t < 40) return 'normal'
  if (t < 50) return 'warm'
  return 'hot'
}

function tempBadgeText(it: Item): string {
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

function badgeType(it: Item): 'info' | 'success' | 'warning' | 'error' {
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

function formatNum(v: any): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '--'
  return n.toFixed(1)
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
  background: linear-gradient(135deg, #36cfc9 0%, #1890ff 100%);
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
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.temp-card {
  position: relative;
  padding: 14px 16px 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e8eaef;
  border-top: 3px solid #1890ff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.18s ease;
}
.temp-card:hover {
  box-shadow: 0 4px 14px rgba(24, 144, 255, 0.12);
}

.temp-card--a {
  border-top-color: #f56c6c;
}
.temp-card--b {
  border-top-color: #67c23a;
}
.temp-card--c {
  border-top-color: #409eff;
}

.temp-card--cold {
  border-top-color: #1890ff;
  background: linear-gradient(180deg, #e6f7ff 0%, #fff 100%);
}
.temp-card--normal {
  background: #fff;
}
.temp-card--warm {
  border-top-color: #faad14;
  background: linear-gradient(180deg, #fff7e6 0%, #fff 100%);
}
.temp-card--hot {
  border-top-color: #f5222d;
  background: linear-gradient(180deg, #fff1f0 0%, #fff 100%);
}

.temp-card__phase {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  letter-spacing: 0.5px;
}
.temp-card__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.temp-card__num {
  font-size: 30px;
  font-weight: 600;
  color: #1f1f1f;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.temp-card__unit {
  font-size: 14px;
  color: #888;
}
.temp-card__spark {
  height: 32px;
  margin-top: 2px;
}
.temp-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

@media (max-width: 900px) {
  .group-body {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .group-body {
    grid-template-columns: 1fr;
  }
}

.temp-card.is-clickable {
  cursor: pointer;
}
</style>