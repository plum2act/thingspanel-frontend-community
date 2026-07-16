<template>
  <div class="ux-stat-card" :style="cardStyle">
    <div class="ux-stat-card__head">
      <span class="ux-stat-card__label">{{ label }}</span>
      <span v-if="badge" class="ux-stat-card__badge" :style="badgeStyle">{{ badge }}</span>
    </div>
    <div class="ux-stat-card__value-row">
      <span class="ux-stat-card__num">{{ formatNum(value) }}</span>
      <span v-if="unit" class="ux-stat-card__unit">{{ unit }}</span>
    </div>
    <div v-if="delta != null" class="ux-stat-card__delta" :style="deltaStyle">
      <span class="ux-stat-card__delta-icon">{{ delta > 0 ? '↑' : delta < 0 ? '↓' : '±' }}</span>
      <span>{{ Math.abs(delta).toFixed(2) }}</span>
      <span class="ux-stat-card__delta-period">vs 上周期</span>
    </div>
    <div v-if="history && history.length" class="ux-stat-card__spark">
      <slot name="sparkline">
        <UxSparkline :points="history" :color="palette.primary" :height="40" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './useTheme'
import UxSparkline from './UxSparkline.vue'

const props = defineProps<{
  label: string
  value: number | string
  unit?: string
  delta?: number
  badge?: string
  badgeType?: 'success' | 'warning' | 'danger' | 'info'
  history?: Array<{ ts: number; value: number }>
  accent?: string
}>()

const { palette } = useTheme()

const cardStyle = computed(() => ({
  background: palette.value.bg1,
  borderColor: palette.value.border1,
  color: palette.value.text1
}))

const formatNum = (v: number | string) => {
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (Number.isNaN(n)) return String(v)
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const badgeStyle = computed(() => {
  const colors = {
    success: palette.value.success,
    warning: palette.value.warning,
    danger: palette.value.danger,
    info: palette.value.info
  }
  const c = props.badgeType ? colors[props.badgeType] : palette.value.info
  return {
    color: c,
    background: c + '20',
    border: `1px solid ${c}40`
  }
})

const deltaStyle = computed(() => {
  if (props.delta == null) return {}
  const c = props.delta > 0 ? palette.value.danger : props.delta < 0 ? palette.value.success : palette.value.text3
  return { color: c }
})
</script>

<style lang="scss" scoped>
.ux-stat-card {
  border: 1px solid;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 0.18s ease;
}
.ux-stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
.ux-stat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ux-stat-card__label {
  font-size: 12px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.ux-stat-card__badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.ux-stat-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.ux-stat-card__num {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.ux-stat-card__unit {
  font-size: 13px;
  opacity: 0.6;
  font-weight: 500;
}
.ux-stat-card__delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}
.ux-stat-card__delta-icon {
  font-size: 13px;
}
.ux-stat-card__delta-period {
  opacity: 0.5;
  font-weight: 400;
  margin-left: 4px;
}
.ux-stat-card__spark {
  height: 40px;
  margin-top: 4px;
}
</style>