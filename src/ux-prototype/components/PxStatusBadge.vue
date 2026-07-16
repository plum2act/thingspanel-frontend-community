<template>
  <span class="px-status-badge" :style="badgeStyle">
    <span class="px-status-badge__dot" :style="dotStyle"></span>
    <span class="px-status-badge__text">{{ text }}</span>
    <span v-if="count != null" class="px-status-badge__count">{{ count }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './useTheme'

const props = defineProps<{
  type: 'online' | 'offline' | 'warn' | 'error' | 'normal' | 'info'
  text: string
  count?: number
}>()

const { palette } = useTheme()

const colorMap = computed(() => ({
  online: palette.value.success,
  offline: palette.value.text3,
  warn: palette.value.warning,
  error: palette.value.danger,
  normal: palette.value.success,
  info: palette.value.info
}))

const badgeStyle = computed(() => {
  const c = colorMap.value[props.type]
  return {
    color: c,
    background: c + '15',
    border: `1px solid ${c}30`
  }
})

const dotStyle = computed(() => {
  const c = colorMap.value[props.type]
  return {
    background: c,
    boxShadow: `0 0 6px ${c}80`
  }
})
</script>

<style lang="scss" scoped>
.px-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
}
.px-status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.px-status-badge__count {
  background: rgba(0, 0, 0, 0.08);
  padding: 0 6px;
  border-radius: 8px;
  font-size: 10px;
  margin-left: 2px;
}
</style>