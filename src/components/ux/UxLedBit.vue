<template>
  <span class="ux-led" :class="on ? 'ux-led--on' : 'ux-led--off'" :style="styleVars">
    <span class="ux-led__dot"></span>
    <span class="ux-led__label">{{ label }}</span>
    <span class="ux-led__txt">{{ on ? 'ON' : 'OFF' }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './useTheme'

const props = defineProps<{
  label: string
  on: boolean
  color?: string
}>()

const { palette } = useTheme()

const color = computed(() => props.color || palette.value.success)

const styleVars = computed(() => {
  const c = color.value
  if (props.on) {
    return {
      '--led-c': c,
      '--led-bg': c + '15',
      '--led-border': c + '40'
    } as Record<string, string>
  }
  return {
    '--led-c': palette.value.text3,
    '--led-bg': palette.value.bg3,
    '--led-border': palette.value.border2
  } as Record<string, string>
})
</script>

<style lang="scss" scoped>
.ux-led {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: var(--led-bg);
  border: 1px solid var(--led-border);
  color: var(--led-c);
}
.ux-led__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--led-c);
}
.ux-led--on .ux-led__dot {
  box-shadow: 0 0 6px var(--led-c);
}
.ux-led__txt {
  opacity: 0.8;
  font-size: 10px;
  min-width: 26px;
  text-align: center;
}
.ux-led__label {
  letter-spacing: 0.3px;
}
</style>