<template>
  <div class="ux-home" :style="{ background: palette.bg0, color: palette.text1 }">
    <div class="ux-home__head">
      <h1>ThingsPanel UX 原型库</h1>
      <p>基于 Figma Community、ThingsBoard、Grafana、华为/阿里 IoT、Datadog 等参考设计的高保真原型。所有数据为 mock，不接入业务 API。</p>
      <div class="ux-home__actions">
        <span :style="{ color: palette.text3, fontSize: '12px' }">主题</span>
        <button
          class="ux-theme-btn"
          :class="{ 'is-active': theme === 'light' }"
          @click="theme = 'light'"
          :style="{ borderColor: palette.border1 }"
        >
          ☀ Light
        </button>
        <button
          class="ux-theme-btn"
          :class="{ 'is-active': theme === 'dark' }"
          @click="theme = 'dark'"
          :style="{ borderColor: palette.border1 }"
        >
          ☾ Dark
        </button>
      </div>
    </div>

    <div class="ux-home__grid">
      <router-link
        v-for="p in pages"
        :key="p.path"
        :to="p.path"
        class="ux-home__card"
        :style="{ background: palette.bg1, borderColor: palette.border1 }"
      >
        <div class="ux-home__card-icon" :style="{ background: p.color + '20', color: p.color }">
          {{ p.icon }}
        </div>
        <div class="ux-home__card-title">{{ p.title }}</div>
        <div class="ux-home__card-desc" :style="{ color: palette.text3 }">{{ p.desc }}</div>
        <div class="ux-home__card-meta" :style="{ color: palette.text3 }">{{ p.meta }}</div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../components/useTheme'

const { theme, palette } = useTheme()

const pages = [
  { path: '/ux-prototype/dashboard', title: '首页 / 系统总览', icon: '◇', desc: '集中监控入口：在线 / 离线 / 告警 KPI', meta: 'Datadog Billboard + Grafana Stat', color: '#0a6cff' },
  { path: '/ux-prototype/devices', title: '设备列表', icon: '☰', desc: '设备卡片 / 表格 + 行级操作 + 状态筛选', meta: 'ThingsBoard 表格', color: '#10b981' },
  { path: '/ux-prototype/device/8d43c2af-062c-b588-779c-312fca3ddc47/telemetry', title: '设备详情 - 遥测 ★', icon: '∑', desc: '三相温度 / DI LED / 电能累积 / 环形 Gauge / 计数器', meta: '核心页面', color: '#ef4444' },
  { path: '/ux-prototype/device/8d43c2af-062c-b588-779c-312fca3ddc47/alarms', title: '设备详情 - 告警', icon: '!', desc: '设备级告警时间线', meta: 'Datadog 事件流', color: '#f59e0b' },
  { path: '/ux-prototype/device/8d43c2af-062c-b588-779c-312fca3ddc47/events', title: '设备详情 - 事件', icon: '→', desc: '设备生命周期 / 配置 / 固件事件', meta: 'ThingsBoard event', color: '#3b82f6' },
  { path: '/ux-prototype/alarm-center', title: '告警中心', icon: '⚠', desc: '全局告警 + 等级 / 状态筛选 + 时间线', meta: 'Datadog 监控', color: '#f87171' },
  { path: '/ux-prototype/template-editor', title: '物模型编辑器 - 单页版', icon: '▤', desc: '华为 IoTDA 风格：单页 + 左侧 nav + 行内编辑', meta: '推荐方案', color: '#22c55e' },
  { path: '/ux-prototype/template-editor-wizard', title: '物模型编辑器 - Wizard 版', icon: '⇄', desc: '现行 5 步向导改造版（对比用）', meta: '过渡方案', color: '#94a3b8' },
  { path: '/ux-prototype/chart-config', title: '图表配置', icon: '◰', desc: 'Web/App 图表 + 仪表盘配置入口', meta: 'ThingsVis Studio', color: '#a855f7' }
]
</script>

<style lang="scss" scoped>
.ux-home {
  min-height: 100vh;
  padding: 32px 32px 64px;
}
.ux-home__head {
  max-width: 800px;
  margin: 0 auto 32px;
  text-align: center;
}
.ux-home__head h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
}
.ux-home__head p {
  font-size: 14px;
  opacity: 0.75;
  line-height: 1.6;
}
.ux-home__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}
.ux-theme-btn {
  border: 1px solid;
  background: transparent;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
}
.ux-theme-btn.is-active {
  background: v-bind('palette.primary');
  color: #fff;
  border-color: v-bind('palette.primary');
}

.ux-home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  max-width: 1280px;
  margin: 0 auto;
}
.ux-home__card {
  border: 1px solid;
  border-radius: 12px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.ux-home__card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}
.ux-home__card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}
.ux-home__card-title {
  font-size: 15px;
  font-weight: 700;
}
.ux-home__card-desc {
  font-size: 12px;
  line-height: 1.5;
}
.ux-home__card-meta {
  font-size: 11px;
  margin-top: 4px;
}
</style>