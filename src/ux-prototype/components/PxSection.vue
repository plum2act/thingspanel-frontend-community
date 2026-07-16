<template>
  <section class="px-section" :style="{ background: palette.bg1, borderColor: palette.border1 }">
    <header class="px-section__head">
      <div class="px-section__icon" :style="{ background: iconBg, color: iconColor }">
        <slot name="icon">{{ icon || '·' }}</slot>
      </div>
      <h3 class="px-section__title">{{ title }}</h3>
      <span v-if="count != null" class="px-section__count">{{ count }} 项</span>
      <span class="px-section__spacer"></span>
      <slot name="actions" />
    </header>
    <div class="px-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './useTheme'

const props = defineProps<{
  title: string
  count?: number
  icon?: string
  iconColor?: string
}>()

const { palette } = useTheme()

const iconBg = computed(() => (props.iconColor || palette.value.primary) + '20')
const iconColor = computed(() => props.iconColor || palette.value.primary)
</script>

<style lang="scss" scoped>
.px-section {
  border: 1px solid;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}
.px-section__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid v-bind('palette.border1');
}
.px-section__icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
}
.px-section__title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}
.px-section__count {
  font-size: 11px;
  opacity: 0.55;
}
.px-section__spacer {
  flex: 1;
}
.px-section__body {
  padding: 16px;
}
</style>