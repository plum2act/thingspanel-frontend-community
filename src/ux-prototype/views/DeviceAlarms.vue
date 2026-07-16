<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <UxPageHeader
      :title="mockDevice.name + ' · 告警'"
      :online="mockDevice.online"
      :diagnosis="mockDevice.diagnosis"
      :device-number="mockDevice.deviceNumber"
      @back="goBack"
    />

    <UxSection title="告警时间线" icon="!" :count="mockAlarms.length" :icon-color="palette.danger">
      <UxTimeline :items="mockAlarms" />
    </UxSection>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/components/ux/useTheme'
import UxPageHeader from '@/components/ux/UxPageHeader.vue'
import UxSection from '@/components/ux/UxSection.vue'
import UxTimeline from '@/components/ux/UxTimeline.vue'
import { mockDevice } from '../mocks/device'
import { mockAlarms } from '../mocks/alarms'

const { palette } = useTheme()
function goBack() { history.back() }
</script>

<style lang="scss" scoped>
.ux-page {
  min-height: 100vh;
  padding: 16px 24px 32px;
}
</style>