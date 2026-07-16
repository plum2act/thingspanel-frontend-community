<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <PxSection title="系统总览" icon="◇" :icon-color="palette.primary">
      <template #actions>
        <button class="ux-btn" :style="{ background: palette.bg2, color: palette.text1, border: `1px solid ${palette.border1}` }">
          配置
        </button>
      </template>
      <div class="ux-grid">
        <PxStatCard label="在线设备" :value="148" badge="实时" badge-type="success" />
        <PxStatCard label="离线设备" :value="3" badge="需关注" badge-type="warning" />
        <PxStatCard label="未处理告警" :value="7" badge="3 critical" badge-type="danger" />
        <PxStatCard label="今日上报" :value="124356" badge="+12%" badge-type="info" />
        <PxStatCard label="累计设备" :value="151" />
        <PxStatCard label="协议数" :value="6" badge="MQTT/Modbus/645/CoAP" badge-type="info" />
      </div>
    </PxSection>

    <PxSection title="最近告警" icon="!" :count="mockAlarms.length" :icon-color="palette.danger">
      <PxTimeline :items="mockAlarms" />
    </PxSection>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../components/useTheme'
import PxSection from '../components/PxSection.vue'
import PxStatCard from '../components/PxStatCard.vue'
import PxTimeline from '../components/PxTimeline.vue'
import { mockAlarms } from '../mocks/alarms'

const { palette } = useTheme()
</script>

<style lang="scss" scoped>
.ux-page {
  min-height: 100vh;
  padding: 16px 24px 32px;
}
.ux-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.ux-btn {
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
</style>