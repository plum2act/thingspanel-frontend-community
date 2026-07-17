<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <PxPageHeader
      :title="mockDevice.name"
      :online="mockDevice.online"
      :warn-count="mockDevice.warnCount"
      :diagnosis="mockDevice.diagnosis"
      :device-number="mockDevice.deviceNumber"
      :address="mockDevice.address"
      :last-seen="mockDevice.lastSeen"
      @back="goBack"
    >
      <template #actions>
        <select class="ux-select" :style="{ background: palette.bg2, borderColor: palette.border1, color: palette.text1 }">
          <option>5s</option>
          <option>10s</option>
          <option>30s</option>
          <option>1min</option>
        </select>
        <button class="ux-btn ux-btn--primary" :style="{ background: palette.primary }">
          图表配置
        </button>
      </template>
    </PxPageHeader>

    <!-- 实时总览 3 大 KPI -->
    <PxSection title="实时总览" icon="∑" :count="kpiPoints.length" :icon-color="palette.primary">
      <div class="ux-kpi-grid">
        <PxStatCard
          v-for="p in kpiPoints"
          :key="p.key"
          :label="p.label"
          :value="p.value"
          :unit="p.unit"
          :history="p.history"
          :delta="0.12"
          :badge="p.kind === 'energy' ? '累计递增' : '实时'"
          :badge-type="p.kind === 'energy' ? 'success' : 'info'"
        />
      </div>
    </PxSection>

    <!-- 三相温度 -->
    <PxSection title="三相温度" icon="🌡" :count="tempPoints.length" :icon-color="palette.danger">
      <div class="ux-phase-grid">
        <div
          v-for="(p, idx) in tempPoints"
          :key="p.key"
          class="ux-phase-card"
          :style="{ background: palette.bg2, borderColor: phaseColor(idx) + '40' }"
        >
          <div class="ux-phase-card__head">
            <span class="ux-phase-card__phase" :style="{ background: phaseColor(idx) }">
              {{ ['A', 'B', 'C'][idx] }}
            </span>
            <span class="ux-phase-card__label">{{ p.label }}</span>
            <span
              class="ux-phase-card__level"
              :style="{ color: levelColor(p.level), background: levelColor(p.level) + '15' }"
            >
              {{ levelLabel(p.level) }}
            </span>
          </div>
          <div class="ux-phase-card__value-row">
            <span class="ux-phase-card__num" :style="{ color: phaseColor(idx) }">
              {{ Number(p.value).toFixed(1) }}
            </span>
            <span class="ux-phase-card__unit">{{ p.unit }}</span>
          </div>
          <div class="ux-phase-card__spark">
            <PxSparkline :points="p.history" :color="phaseColor(idx)" :fill="phaseColor(idx) + '20'" :height="36" />
          </div>
        </div>
      </div>
    </PxSection>

    <!-- 开关量 + 状态字 -->
    <PxSection title="开关量 / 状态字" icon="◉" :count="statusPoints.length" :icon-color="palette.success">
      <div class="ux-status-grid">
        <div
          v-for="p in statusPoints"
          :key="p.key"
          class="ux-status-card"
          :style="{ background: palette.bg2, borderColor: palette.border1 }"
        >
          <div class="ux-status-card__head">
            <span class="ux-status-card__title">{{ p.label }}</span>
            <code class="ux-status-card__hex">0x{{ formatHex(p.value) }}</code>
          </div>
          <div class="ux-status-card__bits">
            <PxLedBit
              v-for="(bit, i) in bitsOf(p.value, p.bitLabels)"
              :key="i"
              :label="bit.label"
              :on="bit.on"
            />
          </div>
        </div>
      </div>
    </PxSection>

    <!-- 电能 -->
    <PxSection title="电能" icon="⚡" :count="energyPoints.length" :icon-color="palette.warning">
      <div class="ux-energy-grid">
        <div
          v-for="p in energyPoints"
          :key="p.key"
          class="ux-energy-card"
          :style="{ background: gradientBg, borderColor: palette.warning + '60' }"
        >
          <div class="ux-energy-card__head">
            <span class="ux-energy-card__title">{{ p.label }}</span>
            <span class="ux-energy-card__trend" :style="{ background: palette.warning + '20', color: palette.warning }">
              ↑ 累计递增
            </span>
          </div>
          <div class="ux-energy-card__num">{{ Number(p.value).toLocaleString('en-US', { maximumFractionDigits: 2 }) }}</div>
          <div class="ux-energy-card__unit">{{ p.unit }}</div>
          <PxSparkline :points="p.history" :color="palette.warning" :fill="palette.warning + '20'" :height="44" />
        </div>
      </div>
    </PxSection>

    <!-- 模拟量（电流/电压/不平衡） -->
    <PxSection title="电流 / 电压 / 不平衡" icon="∿" :count="analogPoints.length" :icon-color="palette.info">
      <div class="ux-analog-grid">
        <div
          v-for="p in analogPoints"
          :key="p.key"
          class="ux-analog-card"
          :style="{ background: palette.bg2, borderColor: palette.border1 }"
        >
          <PxGaugeRing
            :percent="rangePercent(p)"
            :color="rangeColor(p)"
            :size="92"
            :stroke-width="9"
          />
          <div class="ux-analog-card__meta">
            <div class="ux-analog-card__label">{{ p.label }}</div>
            <div class="ux-analog-card__value-row">
              <span class="ux-analog-card__num">{{ Number(p.value).toFixed(1) }}</span>
              <span class="ux-analog-card__unit">{{ p.unit }}</span>
            </div>
            <div class="ux-analog-card__range" :style="{ color: palette.text3 }">
              范围 {{ p.range![0] }} ~ {{ p.range![1] }}{{ p.unit }}
            </div>
            <div class="ux-analog-card__spark">
              <PxSparkline :points="p.history" :color="rangeColor(p)" :fill="rangeColor(p) + '20'" :height="32" />
            </div>
          </div>
        </div>
      </div>
    </PxSection>

    <!-- 计数器 -->
    <PxSection title="计数" icon="#" :count="counterPoints.length" :icon-color="palette.danger">
      <div class="ux-counter-grid">
        <div
          v-for="p in counterPoints"
          :key="p.key"
          class="ux-counter-card"
          :style="{ background: palette.bg2, borderColor: palette.border1 }"
        >
          <div class="ux-counter-card__label">{{ p.label }}</div>
          <div class="ux-counter-card__value-row">
            <span class="ux-counter-card__num">{{ Number(p.value).toLocaleString() }}</span>
            <span class="ux-counter-card__unit">{{ p.unit }}</span>
          </div>
          <div class="ux-counter-card__delta">
            <span :style="{ color: palette.text3 }">本周期增量</span>
            <span class="ux-counter-card__delta-value" :style="{ background: palette.primaryBg, color: palette.primary }">
              +{{ (Math.random() * 3).toFixed(1) }}
            </span>
          </div>
        </div>
      </div>
    </PxSection>

    <!-- 最近告警 -->
    <PxSection title="最近告警" icon="!" :count="recentAlarms.length" :icon-color="palette.danger">
      <PxTimeline :items="recentAlarms" />
    </PxSection>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '../components/useTheme'
import PxPageHeader from '../components/PxPageHeader.vue'
import PxStatusBadge from '../components/PxStatusBadge.vue'
import PxSection from '../components/PxSection.vue'
import PxStatCard from '../components/PxStatCard.vue'
import PxSparkline from '../components/PxSparkline.vue'
import PxGaugeRing from '../components/PxGaugeRing.vue'
import PxLedBit from '../components/PxLedBit.vue'
import PxTimeline from '../components/PxTimeline.vue'
import {
  mockDevice,
  kpiPoints,
  tempPoints,
  statusPoints,
  energyPoints,
  analogPoints,
  counterPoints
} from '../mocks/device'
import { mockAlarms } from '../mocks/alarms'

const { palette } = useTheme()

const recentAlarms = computed(() => mockAlarms.slice(0, 5))

function goBack() {
  if (typeof history !== 'undefined') history.back()
}

const phaseColors = [palette.value.phaseA, palette.value.phaseB, palette.value.phaseC]
function phaseColor(idx: number) {
  return phaseColors[idx] || palette.value.primary
}

function levelColor(level?: string) {
  switch (level) {
    case 'cold':
      return palette.value.info
    case 'warm':
      return palette.value.warning
    case 'hot':
      return palette.value.danger
    default:
      return palette.value.success
  }
}

function levelLabel(level?: string) {
  switch (level) {
    case 'cold':
      return '偏低'
    case 'warm':
      return '偏高'
    case 'hot':
      return '过高'
    default:
      return '正常'
  }
}

const DEFAULT_BITS = ['bit0', 'bit1', 'bit2', 'bit3', 'bit4', 'bit5', 'bit6', 'bit7']
function bitsOf(value: number | string, labels?: string[]) {
  const n = typeof value === 'number' ? value & 0xff : parseInt(String(value), 16) & 0xff
  const arr = labels && labels.length ? labels : DEFAULT_BITS
  const bits: Array<{ label: string; on: boolean }> = []
  for (let i = 0; i < arr.length; i++) {
    bits.push({ label: arr[i], on: Boolean(n & (1 << i)) })
  }
  return bits
}

function formatHex(v: number | string) {
  const n = typeof v === 'number' ? v & 0xff : parseInt(String(v), 16) & 0xff
  return n.toString(16).toUpperCase().padStart(2, '0')
}

function rangePercent(p: { value: number; range?: [number, number] }) {
  if (!p.range) return 0
  const [min, max] = p.range
  const v = Number(p.value)
  return Math.max(0, Math.min(1, (v - min) / (max - min)))
}

function rangeColor(p: { value: number; range?: [number, number] }) {
  const pct = rangePercent(p)
  if (pct < 0.5) return palette.value.success
  if (pct < 0.8) return palette.value.info
  if (pct < 0.95) return palette.value.warning
  return palette.value.danger
}

const gradientBg = computed(() =>
  palette.value.theme === 'dark' || palette.value.bg0 === '#0a0e1a'
    ? `linear-gradient(135deg, ${palette.value.bg1} 0%, ${palette.value.bg2} 100%)`
    : 'linear-gradient(135deg, #fffbe6 0%, #ffffff 60%)'
)
</script>

<style lang="scss" scoped>
.ux-page {
  min-height: 100vh;
  padding: 16px 24px 32px;
}

.ux-select {
  border: 1px solid;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}
.ux-btn {
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
}
.ux-btn--primary:hover {
  filter: brightness(1.1);
}

/* KPI */
.ux-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* 三相温度 */
.ux-phase-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 880px) {
  .ux-phase-grid {
    grid-template-columns: 1fr;
  }
}
.ux-phase-card {
  border: 1px solid;
  border-left-width: 4px;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ux-phase-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ux-phase-card__phase {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
}
.ux-phase-card__label {
  font-size: 12px;
  font-weight: 600;
  flex: 1;
}
.ux-phase-card__level {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.ux-phase-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ux-phase-card__num {
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.ux-phase-card__unit {
  font-size: 14px;
  opacity: 0.6;
}
.ux-phase-card__spark {
  height: 36px;
}

/* 开关量 */
.ux-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.ux-status-card {
  border: 1px solid;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ux-status-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ux-status-card__title {
  font-weight: 600;
  font-size: 13px;
}
.ux-status-card__hex {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 11px;
  opacity: 0.6;
}
.ux-status-card__bits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 电能 */
.ux-energy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}
.ux-energy-card {
  border: 1px solid;
  border-left-width: 4px;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ux-energy-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ux-energy-card__title {
  font-size: 13px;
  font-weight: 600;
}
.ux-energy-card__trend {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.ux-energy-card__num {
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(90deg, v-bind('palette.warning') 0%, v-bind('palette.danger') 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ux-energy-card__unit {
  font-size: 14px;
  opacity: 0.6;
}

/* 模拟量 */
.ux-analog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.ux-analog-card {
  border: 1px solid;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  gap: 14px;
  align-items: center;
}
.ux-analog-card__meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ux-analog-card__label {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.85;
}
.ux-analog-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ux-analog-card__num {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.ux-analog-card__unit {
  font-size: 12px;
  opacity: 0.6;
}
.ux-analog-card__range {
  font-size: 11px;
}
.ux-analog-card__spark {
  height: 32px;
}

/* 计数器 */
.ux-counter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.ux-counter-card {
  border: 1px solid;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ux-counter-card__label {
  font-size: 12px;
  opacity: 0.75;
}
.ux-counter-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ux-counter-card__num {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.ux-counter-card__unit {
  font-size: 12px;
  opacity: 0.6;
}
.ux-counter-card__delta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.ux-counter-card__delta-value {
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 600;
}
</style>