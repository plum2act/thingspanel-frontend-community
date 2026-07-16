<script setup lang="ts">
import { $t } from '@/locales'
import { useSysSettingStore } from '@/store/modules/sys-setting'

defineOptions({
  name: 'GlobalLogo'
})
const sysSettingStore = useSysSettingStore()

interface Props {
  /** Whether to show the title */
  showTitle?: boolean
}

withDefaults(defineProps<Props>(), {
  showTitle: true
})
</script>

<template>
  <RouterLink to="/" class="w-full flex items-center nowrap-hidden ml-3">
    <div class="logo-box">
      <SystemLogo width="150" />
    </div>
  </RouterLink>
</template>

<style scoped>
  .logo-box {
    display: flex;
    align-items: center;
  }
</style>
