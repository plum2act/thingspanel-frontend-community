<template>
  <div class="ux-timeline">
    <div v-for="(item, idx) in items" :key="item.id" class="ux-timeline__item">
      <div class="ux-timeline__rail">
        <div class="ux-timeline__dot" :style="{ background: levelColor(item.level) }"></div>
        <div v-if="idx < items.length - 1" class="ux-timeline__line"></div>
      </div>
      <div class="ux-timeline__body">
        <div class="ux-timeline__head">
          <span class="ux-timeline__title">{{ item.title }}</span>
          <span class="ux-timeline__ts">{{ formatTime(item.ts) }}</span>
        </div>
        <div class="ux-timeline__detail">{{ item.detail }}</div>
        <div v-if="item.source" class="ux-timeline__source">
          <span>来源：{{ item.source }}</span>
          <span v-if="item.status" class="ux-timeline__status" :class="`is-${item.status}`">
            {{ item.status === 'active' ? '进行中' : '已恢复' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from './useTheme'

export interface UxTimelineItem {
  id: string | number
  level?: 'critical' | 'warning' | 'info'
  ts: number | string
  title: string
  detail: string
  source?: string
  status?: 'active' | 'recovered'
}

const props = defineProps<{
  items: UxTimelineItem[]
}>()

const { palette } = useTheme()

function levelColor(level?: string) {
  switch (level) {
    case 'critical':
      return palette.value.danger
    case 'warning':
      return palette.value.warning
    case 'info':
      return palette.value.info
    default:
      return palette.value.text3
  }
}

function formatTime(ts: number | string) {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
</script>

<style lang="scss" scoped>
.ux-timeline {
  display: flex;
  flex-direction: column;
}
.ux-timeline__item {
  display: flex;
  gap: 12px;
}
.ux-timeline__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
  padding-top: 4px;
}
.ux-timeline__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ux-timeline__line {
  flex: 1;
  width: 2px;
  background: v-bind('palette.border2');
  margin-top: 4px;
  margin-bottom: -4px;
}
.ux-timeline__body {
  flex: 1;
  padding-bottom: 16px;
}
.ux-timeline__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ux-timeline__title {
  font-weight: 600;
  font-size: 13px;
}
.ux-timeline__ts {
  font-size: 11px;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}
.ux-timeline__detail {
  font-size: 12px;
  opacity: 0.75;
  margin-top: 2px;
}
.ux-timeline__source {
  font-size: 11px;
  opacity: 0.55;
  margin-top: 4px;
  display: flex;
  gap: 8px;
}
.ux-timeline__status {
  padding: 0 6px;
  border-radius: 6px;
  font-weight: 600;
}
.ux-timeline__status.is-active {
  background: v-bind('palette.danger') + '20';
  color: v-bind('palette.danger');
}
.ux-timeline__status.is-recovered {
  background: v-bind('palette.success') + '20';
  color: v-bind('palette.success');
}
</style>