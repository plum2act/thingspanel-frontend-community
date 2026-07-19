<template>
  <section class="group group--other">
    <header class="group-head">
      <div class="group-icon"><NIcon size="18"><Calculator /></NIcon></div>
      <h3 class="group-title">其他</h3>
      <span class="group-count">{{ items.length }} 项</span>
    </header>

    <div class="group-body">
      <div
        v-for="i in items"
        :key="i.key"
        class="other-card"
        :class="[metricCardClass(i), isColor(i) ? '' : 'is-clickable']"
        :title="isColor(i) ? undefined : '查看趋势'"
        @click="onCardClick(i)"
      >
        <div class="other-card__head">
          <div class="other-card__title" :title="i.key">
            <span v-if="i.label" class="other-card__label">{{ i.label }}</span>
            <span v-else class="other-card__label other-card__label--unknown">{{ i.key }}</span>
            <span class="other-card__key">({{ i.key }})</span>
          </div>
          <n-tag :type="statusTagType(i)" size="small" round :bordered="false">
            {{ statusLabel(i) }}
          </n-tag>
        </div>

        <div class="other-card__value-row">
          <template v-if="isColor(i)">
            <span class="other-card__text">{{ formatText(i) }}</span>
          </template>
          <template v-else>
            <MovingNumbers :data-index="i.key" :m-num="roundNum(i.value)" :quantile-show="true" />
            <span v-if="i.unit" class="other-card__unit">{{ i.unit }}</span>
          </template>
        </div>

        <div v-if="!isColor(i)" class="other-card__spark">
          <SparkLine :points="sparkBuffer[i.key] || []" />
        </div>

        <div class="other-card__foot">
          <span>{{ formatRelativeTime(i.ts) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="tsx">
import { Calculator } from '@vicons/tabler'
import { MovingNumbers } from 'moving-numbers-vue3'
import SparkLine from '../modules/SparkLine.vue'
import { formatRelativeTime } from '@/utils/common/datetime'

interface Item {
  key: string
  value: any
  label?: string
  unit?: string
  ts?: string | number
}

const props = defineProps<{
  items: Item[]
  sparkBuffer: Record<string, Array<{ ts: number; value: number }>>
  statusTagType: (i: any) => 'success' | 'default' | 'warning'
  statusLabel: (i: any) => string
  metricCardClass: (i: any) => string
  isColor: (i: any) => string
}>()

const emit = defineEmits<{ (e: 'view-history', item: Item): void }>()

function onCardClick(i: Item) {
  if (props.isColor(i)) return // 非数值不响应
  emit('view-history', i)
}

function formatText(i: Item): string {
  if (i.value == null || i.value === '') return '--'
  if (typeof i.value === 'object') return JSON.stringify(i.value)
  return String(i.value)
}

/** 数值最多保留 3 位小数（V0.0.5 解出的浮点常有长尾，如 12.3459999）。
 *  非数值/非有限值原样透传（MovingNumbers 只在数值分支渲染）。 */
function roundNum(v: any): any {
  if (typeof v !== 'number' || !Number.isFinite(v)) return v
  return Math.round(v * 1000) / 1000
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
  background: linear-gradient(135deg, #8c8c8c 0%, #595959 100%);
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.other-card {
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e8eaef;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.other-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.other-card__title {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.other-card__label {
  color: #333;
}
.other-card__label--unknown {
  color: #999;
}
.other-card__key {
  color: #aaa;
  font-size: 11px;
  margin-left: 4px;
}

.other-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.other-card__text {
  font-size: 18px;
  color: #333;
}
.other-card__unit {
  font-size: 12px;
  color: #888;
}

.other-card__spark {
  height: 32px;
}
.other-card__foot {
  font-size: 11px;
  color: #999;
}

.other-card.is-clickable {
  cursor: pointer;
}
</style>