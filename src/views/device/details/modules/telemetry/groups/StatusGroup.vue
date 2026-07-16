<template>
  <section class="group group--status">
    <header class="group-head">
      <div class="group-icon"><NIcon size="18"><Power /></NIcon></div>
      <h3 class="group-title">开关 / 状态字</h3>
      <span class="group-count">{{ items.length }} 项</span>
    </header>

    <div class="group-body">
      <div v-for="it in items" :key="it.key" class="status-card">
        <div class="status-card__head">
          <span class="status-card__title">{{ it.label || it.key }}</span>
          <span class="status-card__bits-meta">{{ bitInfo(it).bitCount }} bit</span>
        </div>

        <!-- 位 LED 行 -->
        <div class="status-card__bits">
          <div v-for="b in bitInfo(it).bits" :key="b.idx" class="led-row">
            <span class="led-row__label">{{ b.label }}</span>
            <span class="led" :class="b.on ? 'led--on' : 'led--off'" :title="`bit${b.idx}=${b.on ? '1' : '0'}`">
              <span class="led__dot"></span>
              <span class="led__txt">{{ b.on ? 'ON' : 'OFF' }}</span>
            </span>
          </div>
        </div>

        <!-- 原始数值 -->
        <div class="status-card__foot">
          <code class="status-card__hex">0x{{ formatHex(it.value) }}</code>
          <span class="status-card__ts">{{ formatRelativeTime(it.ts) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="tsx">
import { Power } from '@vicons/tabler'
import { formatRelativeTime } from '@/utils/common/datetime'

interface Item {
  key: string
  value: any
  label?: string
  ts?: string | number
}

const props = defineProps<{
  items: Item[]
}>()

// 按 key 推断位含义（与 stub toggle mask 对齐）
const BIT_LABELS: Record<string, string[]> = {
  // DI 开关量：bit0..bit3 = 4 个 DI
  mccb_di1_status: ['DI1', 'DI2', 'DI3', 'DI4'],
  mccb_di2_status: ['DI1', 'DI2', 'DI3', 'DI4'],
  mccb_di3_status: ['DI1', 'DI2', 'DI3', 'DI4'],
  mccb_di4_status: ['DI1', 'DI2', 'DI3', 'DI4']
}

const DEFAULT_BIT_LABELS = ['bit0', 'bit1', 'bit2', 'bit3', 'bit4', 'bit5', 'bit6', 'bit7']

function parseValue(v: any): number {
  if (typeof v === 'number') return v & 0xFF
  if (typeof v === 'string') {
    // 字符串值可能是 JSON {"bit0":true,...} 或 "05"/"0x05"
    try {
      const j = JSON.parse(v)
      if (typeof j === 'object' && j !== null) {
        let n = 0
        for (let i = 0; i < 8; i++) {
          if (j[`bit${i}`]) n |= 1 << i
        }
        return n
      }
    } catch {
      // not JSON, try hex
    }
    const m = v.match(/0x([0-9a-fA-F]+)/)
    if (m) return parseInt(m[1], 16) & 0xFF
    const n = parseInt(v, 16)
    if (!Number.isNaN(n)) return n & 0xFF
  }
  return 0
}

function bitInfo(it: Item): { bitCount: number; bits: Array<{ idx: number; label: string; on: boolean }> } {
  const n = parseValue(it.value)
  const labels = BIT_LABELS[it.key] || DEFAULT_BIT_LABELS
  // 自动探测 bitCount：找到最高有效位；最少显示 4 bit，最多 8
  let highBit = 3
  for (let i = 7; i >= 0; i--) {
    if (n & (1 << i)) {
      highBit = i
      break
    }
  }
  const bitCount = Math.min(8, Math.max(4, highBit + 1))
  const bits: Array<{ idx: number; label: string; on: boolean }> = []
  for (let i = 0; i < bitCount; i++) {
    bits.push({
      idx: i,
      label: labels[i] || `bit${i}`,
      on: Boolean(n & (1 << i))
    })
  }
  return { bitCount, bits }
}

function formatHex(v: any): string {
  const n = parseValue(v)
  return n.toString(16).toUpperCase().padStart(2, '0')
}
</script>

<style lang="scss" scoped>
.group {
  margin-bottom: 24px;
}
.group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.group-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, #52c41a 0%, #1890ff 100%);
  color: #fff;
}
.group-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.group-count {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.group-body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.status-card {
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e8eaef;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 0.18s ease;
}
.status-card:hover {
  box-shadow: 0 4px 14px rgba(82, 196, 26, 0.12);
}

.status-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.status-card__title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.status-card__bits-meta {
  font-size: 11px;
  color: #999;
  background: #f5f5f5;
  padding: 1px 6px;
  border-radius: 8px;
}

.status-card__bits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.led-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.led-row__label {
  color: #555;
  min-width: 32px;
}

.led {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1px solid #e8eaef;
  background: #fafafa;
  transition: all 0.2s ease;
}
.led__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  box-shadow: none;
}
.led__txt {
  color: #999;
  min-width: 26px;
  text-align: center;
}

.led--on {
  background: #f6ffed;
  border-color: #b7eb8f;
}
.led--on .led__dot {
  background: #52c41a;
  box-shadow: 0 0 6px rgba(82, 196, 26, 0.6);
}
.led--on .led__txt {
  color: #389e0d;
}

.led--off {
  opacity: 0.85;
}
.led--off .led__dot {
  background: #d9d9d9;
}

.status-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.status-card__hex {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  color: #555;
  background: #f5f5f5;
  padding: 1px 6px;
  border-radius: 4px;
}
</style>