<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <UxPageHeader
      :title="mockDevice.name + ' · 事件流'"
      :online="mockDevice.online"
      :device-number="mockDevice.deviceNumber"
      @back="goBack"
    />

    <UxSection title="事件流" icon="→" :count="mockEvents.length" :icon-color="palette.info">
      <div class="ux-events">
        <div
          v-for="e in mockEvents"
          :key="e.id"
          class="ux-event"
          :style="{ background: palette.bg2, borderColor: palette.border1 }"
        >
          <span class="ux-event__type" :style="{ color: typeColor(e.type) }">{{ typeLabel(e.type) }}</span>
          <div class="ux-event__body">
            <div class="ux-event__title">{{ e.title }}</div>
            <div class="ux-event__detail">{{ e.detail }}</div>
          </div>
          <div class="ux-event__meta">
            <div>{{ formatTime(e.ts) }}</div>
            <div :style="{ color: palette.text3 }">{{ e.actor }}</div>
          </div>
        </div>
      </div>
    </UxSection>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/components/ux/useTheme'
import UxPageHeader from '@/components/ux/UxPageHeader.vue'
import UxSection from '@/components/ux/UxSection.vue'
import { mockDevice } from '../mocks/device'
import { mockEvents } from '../mocks/events'

const { palette } = useTheme()
function goBack() { history.back() }

function typeColor(t: string) {
  switch (t) {
    case 'alarm': return palette.value.danger
    case 'firmware': return palette.value.warning
    case 'offline': return palette.value.text3
    case 'online': return palette.value.success
    default: return palette.value.info
  }
}

function typeLabel(t: string) {
  return { alarm: '告警', firmware: '升级', offline: '下线', online: '上线', config: '配置' }[t] || t
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${min}`
}
</script>

<style lang="scss" scoped>
.ux-page { min-height: 100vh; padding: 16px 24px 32px; }
.ux-events { display: flex; flex-direction: column; gap: 8px; }
.ux-event {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid;
  border-radius: 8px;
  align-items: center;
}
.ux-event__type { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
.ux-event__title { font-size: 13px; font-weight: 600; }
.ux-event__detail { font-size: 12px; opacity: 0.7; margin-top: 2px; }
.ux-event__meta { text-align: right; font-size: 11px; opacity: 0.65; display: flex; flex-direction: column; gap: 2px; }
</style>