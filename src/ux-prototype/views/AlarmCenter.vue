<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <div class="ux-toolbar">
      <h2 class="ux-title">告警中心</h2>
      <div class="ux-toolbar__actions">
        <select class="ux-select" :style="selectStyle">
          <option>全部等级</option>
          <option>critical</option>
          <option>warning</option>
        </select>
        <select class="ux-select" :style="selectStyle">
          <option>全部状态</option>
          <option>进行中</option>
          <option>已恢复</option>
        </select>
      </div>
    </div>

    <div class="ux-grid">
      <div class="ux-summary" :style="{ background: palette.bg1, borderColor: palette.border1 }">
        <div class="ux-summary__label">进行中</div>
        <div class="ux-summary__num" :style="{ color: palette.danger }">{{ activeCount }}</div>
      </div>
      <div class="ux-summary" :style="{ background: palette.bg1, borderColor: palette.border1 }">
        <div class="ux-summary__label">critical</div>
        <div class="ux-summary__num" :style="{ color: palette.danger }">{{ criticalCount }}</div>
      </div>
      <div class="ux-summary" :style="{ background: palette.bg1, borderColor: palette.border1 }">
        <div class="ux-summary__label">warning</div>
        <div class="ux-summary__num" :style="{ color: palette.warning }">{{ warningCount }}</div>
      </div>
      <div class="ux-summary" :style="{ background: palette.bg1, borderColor: palette.border1 }">
        <div class="ux-summary__label">今日已恢复</div>
        <div class="ux-summary__num" :style="{ color: palette.success }">{{ recoveredCount }}</div>
      </div>
    </div>

    <PxSection title="告警时间线" icon="!" :count="mockAlarms.length" :icon-color="palette.danger">
      <PxTimeline :items="mockAlarms" />
    </PxSection>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '../components/useTheme'
import PxSection from '../components/PxSection.vue'
import PxTimeline from '../components/PxTimeline.vue'
import { mockAlarms } from '../mocks/alarms'

const { palette } = useTheme()
const selectStyle = computed(() => ({
  background: palette.value.bg2,
  borderColor: palette.value.border1,
  color: palette.value.text1
}))

const activeCount = computed(() => mockAlarms.filter(a => a.status === 'active').length)
const criticalCount = computed(() => mockAlarms.filter(a => a.level === 'critical').length)
const warningCount = computed(() => mockAlarms.filter(a => a.level === 'warning').length)
const recoveredCount = computed(() => mockAlarms.filter(a => a.status === 'recovered').length)
</script>

<style lang="scss" scoped>
.ux-page {
  min-height: 100vh;
  padding: 16px 24px 32px;
}
.ux-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.ux-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.ux-toolbar__actions {
  display: flex;
  gap: 8px;
}
.ux-select {
  border: 1px solid;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  outline: none;
}
.ux-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.ux-summary {
  border: 1px solid;
  border-radius: 8px;
  padding: 16px;
}
.ux-summary__label {
  font-size: 12px;
  opacity: 0.65;
  margin-bottom: 4px;
}
.ux-summary__num {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>