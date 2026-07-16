<template>
  <div class="px-gauge-ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
        style="transition: stroke-dashoffset 0.6s ease"
      />
      <text
        :x="size / 2"
        :y="size / 2 - 4"
        text-anchor="middle"
        dominant-baseline="central"
        :fill="palette.text1"
        :font-size="size * 0.22"
        font-weight="700"
      >
        {{ Math.round(percent) }}%
      </text>
      <text
        v-if="label"
        :x="size / 2"
        :y="size / 2 + size * 0.18"
        text-anchor="middle"
        :fill="palette.text3"
        :font-size="size * 0.11"
      >
        {{ label }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './useTheme'

const props = withDefaults(
  defineProps<{
    /** 0..1 */
    percent: number
    color?: string
    trackColor?: string
    size?: number
    strokeWidth?: number
    label?: string
  }>(),
  { size: 80, strokeWidth: 8 }
)

const { palette } = useTheme()

const radius = computed(() => props.size / 2 - props.strokeWidth)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - Math.max(0, Math.min(1, props.percent))))
const trackColor = computed(() => props.trackColor || palette.value.border2)
</script>

<style lang="scss" scoped>
.px-gauge-ring {
  display: inline-flex;
}
</style>