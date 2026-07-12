<script lang="ts" setup>
import { useSysSettingStore } from '@/store/modules/sys-setting'
defineOptions({ name: 'SystemLogo' })
const sysSettingStore = useSysSettingStore()
export interface Props {
  width: string
}

withDefaults(defineProps<Props>(), {
  width: '40'
})
</script>

<template>
  <!-- <IconLocalLogo /> -->
  <n-image
    :width="width"
    :src="sysSettingStore.logo_background === '' ? '/logo.png' : sysSettingStore.logo_background"
  />
</template>

<style scoped>
:deep(.n-image > img) {
  height: auto;
}
</style>
