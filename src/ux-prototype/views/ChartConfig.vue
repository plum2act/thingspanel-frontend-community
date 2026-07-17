<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <div class="ux-toolbar">
      <h2 class="ux-title">图表配置</h2>
      <div class="ux-toolbar__actions">
        <button class="ux-btn" :style="{ background: palette.bg2, color: palette.text1, border: `1px solid ${palette.border1}` }">
          导入
        </button>
        <button class="ux-btn ux-btn--primary" :style="{ background: palette.primary }">+ 新建图表</button>
      </div>
    </div>

    <div class="ux-grid">
      <div
        v-for="(c, i) in charts"
        :key="i"
        class="ux-chart-card"
        :style="{ background: palette.bg1, borderColor: palette.border1 }"
      >
        <div class="ux-chart-card__head">
          <span class="ux-chart-card__title">{{ c.name }}</span>
          <span class="ux-chart-card__type">{{ c.type }}</span>
        </div>
        <div class="ux-chart-card__preview" :style="{ background: palette.bg2 }">
          <PxSparkline :points="c.points" :color="palette.primary" :height="80" />
        </div>
        <div class="ux-chart-card__meta" :style="{ color: palette.text3 }">
          {{ c.fields }} 个字段 · 最近修改 {{ c.modified }}
        </div>
        <div class="ux-chart-card__foot">
          <button class="ux-link" :style="{ color: palette.primary }">编辑</button>
          <button class="ux-link" :style="{ color: palette.primary }">预览</button>
          <button class="ux-link ux-link--danger" :style="{ color: palette.danger }">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../components/useTheme'
import PxSparkline from '../components/PxSparkline.vue'

const { palette } = useTheme()

function gen(seed: number, base: number, amp: number, n = 30) {
  const now = Date.now()
  return Array.from({ length: n }, (_, i) => ({
    ts: now - (n - i) * 60_000,
    value: Number((base + amp * Math.sin((seed + i) / 5)).toFixed(1))
  }))
}

const charts = [
  { name: '三相电流趋势', type: '折线图', fields: 4, modified: '12 分钟前', points: gen(1, 230, 40) },
  { name: '电能累积', type: '面积图', fields: 2, modified: '1 小时前', points: gen(2, 12000, 800) },
  { name: '温度雷达', type: '雷达图', fields: 3, modified: '2 天前', points: gen(3, 40, 8) },
  { name: '告警分布', type: '柱状图', fields: 5, modified: '3 小时前', points: gen(4, 5, 3) },
  { name: 'DI 状态矩阵', type: 'LED 矩阵', fields: 16, modified: '5 小时前', points: gen(5, 0.5, 0.5) },
  { name: '设备运行率', type: '仪表盘', fields: 1, modified: '昨天', points: gen(6, 85, 5) }
]
</script>

<style lang="scss" scoped>
.ux-page { min-height: 100vh; padding: 16px 24px 32px; }
.ux-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
.ux-title { font-size: 20px; font-weight: 700; margin: 0; }
.ux-toolbar__actions { display: flex; gap: 8px; }
.ux-btn { border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; color: #fff; }

.ux-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.ux-chart-card {
  border: 1px solid;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ux-chart-card__head { display: flex; align-items: center; justify-content: space-between; }
.ux-chart-card__title { font-weight: 600; font-size: 13px; }
.ux-chart-card__type { font-size: 11px; padding: 1px 8px; border-radius: 8px; background: v-bind('palette.primaryBg'); color: v-bind('palette.primary'); }
.ux-chart-card__preview { border-radius: 6px; padding: 8px; height: 96px; }
.ux-chart-card__meta { font-size: 11px; }
.ux-chart-card__foot { display: flex; gap: 12px; }
.ux-link { background: transparent; border: none; cursor: pointer; font-weight: 600; font-size: 12px; }
</style>