<template>
  <div ref="el" class="ux-sparkline"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer])

const props = withDefaults(
  defineProps<{
    points: Array<{ ts: number; value: number }>
    color?: string
    fill?: string
    height?: number
  }>(),
  {
    height: 40
  }
)

const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function makeOption() {
  const data = (props.points || []).map(p => [p.ts, p.value])
  const c = props.color || '#0a6cff'
  const f = props.fill || c + '20'
  return {
    grid: { top: 4, right: 2, bottom: 4, left: 2, containLabel: false },
    xAxis: {
      type: 'time',
      show: false,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      show: false,
      scale: true
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        const d = new Date(p.value[0])
        return `${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}<br/>${p.value[1]}`
      },
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 11 }
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: c, width: 2 },
        areaStyle: { color: f, opacity: 1 },
        data
      }
    ]
  } as any
}

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value, undefined, { renderer: 'svg' })
  chart.setOption(makeOption())
})

watch(
  () => [props.points, props.color, props.fill],
  () => {
    chart?.setOption(makeOption())
  },
  { deep: true }
)

onBeforeUnmount(() => {
  chart?.dispose()
  chart = null
})
</script>

<style lang="scss" scoped>
.ux-sparkline {
  width: 100%;
  height: 100%;
  min-height: 24px;
}
</style>