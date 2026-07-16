<template>
  <header class="px-page-header" :style="{ background: palette.bg1, borderColor: palette.border1 }">
    <div class="px-page-header__top">
      <button class="px-page-header__back" :style="{ color: palette.text2 }" @click="$emit('back')">
        ◀ 返回
      </button>
      <div class="px-page-header__title-row">
        <div class="px-page-header__title">{{ title }}</div>
        <div class="px-page-header__meta">
          <PxStatusBadge :type="online ? 'online' : 'offline'" :text="online ? '在线' : '离线'" />
          <PxStatusBadge v-if="warnCount" type="warn" :text="'告警'" :count="warnCount" />
          <PxStatusBadge :type="diagnosis" :text="diagnosisLabel" />
        </div>
      </div>
      <div class="px-page-header__actions">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="subtitle || deviceNumber" class="px-page-header__sub" :style="{ color: palette.text3 }">
      <span v-if="deviceNumber">设备编号：{{ deviceNumber }}</span>
      <span v-if="address">　·　{{ address }}</span>
      <span v-if="lastSeenLabel">　·　最近上报：{{ lastSeenLabel }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './useTheme'
import PxStatusBadge from './PxStatusBadge.vue'

const props = defineProps<{
  title: string
  online: boolean
  warnCount?: number
  diagnosis?: 'normal' | 'warn' | 'error'
  deviceNumber?: string
  address?: string
  lastSeen?: number
}>()

defineEmits<{ back: [] }>()

const { palette } = useTheme()

const lastSeenLabel = computed(() => {
  if (!props.lastSeen) return ''
  const sec = Math.round((Date.now() - props.lastSeen) / 1000)
  if (sec < 60) return `${sec} 秒前`
  return `${Math.round(sec / 60)} 分钟前`
})

const diagnosis = computed(() => props.diagnosis || 'normal')

const diagnosisLabel = computed(() => {
  switch (diagnosis.value) {
    case 'normal':
      return '诊断正常'
    case 'warn':
      return '需关注'
    case 'error':
      return '异常'
    default:
      return ''
  }
})
</script>

<style lang="scss" scoped>
.px-page-header {
  border: 1px solid;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.px-page-header__top {
  display: flex;
  align-items: center;
  gap: 16px;
}
.px-page-header__back {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
}
.px-page-header__back:hover {
  background: v-bind('palette.bg3');
}
.px-page-header__title-row {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.px-page-header__title {
  font-size: 18px;
  font-weight: 700;
}
.px-page-header__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.px-page-header__actions {
  display: flex;
  gap: 8px;
}
.px-page-header__sub {
  font-size: 12px;
  margin-top: 8px;
}
</style>