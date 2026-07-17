<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <PxPageHeader
      :title="mockDevice.name + ' · 告警'"
      :online="mockDevice.online"
      :diagnosis="mockDevice.diagnosis"
      :device-number="mockDevice.deviceNumber"
      @back="goBack"
    />

    <PxSection title="告警时间线" icon="!" :count="mockAlarms.length" :icon-color="palette.danger">
      <PxTimeline :items="mockAlarms" />
    </PxSection>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../components/useTheme'
import PxPageHeader from '../components/PxPageHeader.vue'
import PxSection from '../components/PxSection.vue'
import PxTimeline from '../components/PxTimeline.vue'
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