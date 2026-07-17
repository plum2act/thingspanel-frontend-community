<script setup lang="ts">
import { computed } from 'vue'

interface Point {
  ts: number
  value: number
}

const props = withDefaults(
  defineProps<{
    points: Point[]
    /** viewBox 宽，默认 120 */
    width?: number
    /** viewBox 高，默认 32 */
    height?: number
    /** 描边色，默认主题色；传 CSS 变量字符串 */
    stroke?: string
    /** 是否填充渐变区域，默认 true */
    fill?: boolean
  }>(),
  {
    width: 120,
    height: 32,
    stroke: 'rgb(var(--primary-color))',
    fill: true
  }
)

/** 空态：点数 < 2 不画线（显示底部虚线占位） */
const isEmpty = computed(() => !props.points || props.points.length < 2)

interface PathShape {
  line: string
  area: string
  last: { x: number; y: number } | null
}

/**
 * min-max 归一化：x 均分到 [0, width]，y 映射到 [pad, height-pad]。
 * min===max（水平直线）时给中位线，避免除零。
 */
const path = computed<PathShape>(() => {
  const pts = props.points
  if (isEmpty.value) return { line: '', area: '', last: null }
  const vals = pts.map(p => p.value)
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  if (min === max) {
    min -= 1
    max += 1
  }
  const pad = 3
  const usableH = props.height - pad * 2
  const usableW = props.width
  const n = pts.length
  const xy = pts.map((p, i) => {
    const x = n === 1 ? 0 : (i / (n - 1)) * usableW
    const y = pad + (1 - (p.value - min) / (max - min)) * usableH
    return { x, y }
  })
  const line = xy.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const area = `${line} L${usableW.toFixed(2)},${props.height} L0,${props.height} Z`
  const last = xy.length ? { x: xy[xy.length - 1].x, y: xy[xy.length - 1].y } : null
  return { line, area, last }
})

/** 唯一 id，防多实例 SVG 渐变定义冲突 */
const gid = `sl-grad-${Math.random().toString(36).slice(2, 9)}`
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    class="sparkline"
    :style="{ width: '100%', height: height + 'px', display: 'block' }"
  >
    <!-- 空态：底部虚线占位 -->
    <line
      v-if="isEmpty"
      x1="0"
      :y1="height - 2"
      :x2="width"
      :y2="height - 2"
      stroke="#e0e0e0"
      stroke-width="1"
      stroke-dasharray="3,3"
    />
    <template v-else>
      <defs>
        <linearGradient :id="gid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="stroke" stop-opacity="0.28" />
          <stop offset="100%" :stop-color="stroke" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <path v-if="fill" :d="path.area" :fill="`url(#${gid})`" stroke="none" />
      <path
        :d="path.line"
        fill="none"
        :stroke="stroke"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <!-- 末点高亮 -->
      <circle v-if="path.last" :cx="path.last.x.toFixed(2)" :cy="path.last.y.toFixed(2)" r="2" :fill="stroke" />
    </template>
  </svg>
</template>

<style scoped>
.sparkline {
  overflow: visible;
}
</style>
