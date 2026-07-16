<template>
  <div class="ux-empty" :style="{ color: palette.text3 }">
    <div class="ux-empty__icon">
      <slot name="icon">
        <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="10" y="14" width="44" height="36" rx="4" />
          <path d="M10 24 H54" />
          <circle cx="16" cy="19" r="1.5" fill="currentColor" />
          <circle cx="21" cy="19" r="1.5" fill="currentColor" />
        </svg>
      </slot>
    </div>
    <div class="ux-empty__title">{{ title }}</div>
    <div v-if="description" class="ux-empty__desc">{{ description }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useTheme } from './useTheme'

defineProps<{
  title: string
  description?: string
}>()

const { palette } = useTheme()
</script>

<style lang="scss" scoped>
.ux-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 8px;
  text-align: center;
}
.ux-empty__icon {
  opacity: 0.6;
  margin-bottom: 8px;
}
.ux-empty__title {
  font-size: 14px;
  font-weight: 600;
}
.ux-empty__desc {
  font-size: 12px;
  opacity: 0.75;
}
</style>