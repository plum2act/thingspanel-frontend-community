<script setup lang="ts">
import { useSysSettingStore } from '@/store/modules/sys-setting'

defineOptions({
  name: 'GlobalFooter'
})

const sysSettingStore = useSysSettingStore()
</script>

<template>
  <DarkModeContainer class="h-full flex-center">
    <div class="flex flex-wrap items-center justify-center gap-x-2 text-center text-xs text-[var(--n-text-color)]">
      <a href="#" target="_blank" rel="noopener noreferrer">
        Copyright &copy; 2024 {{ sysSettingStore.system_name }}
      </a>
    </div>
  </DarkModeContainer>
</template>

<style scoped></style>
