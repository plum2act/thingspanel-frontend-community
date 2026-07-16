<script setup lang="ts">
import { useTheme } from '@/components/ux/useTheme'
import UxPageHeader from '@/components/ux/UxPageHeader.vue'
import { $t } from '@/locales'


const { palette } = useTheme()
</script>

<template>
    <UxPageHeader
      class="page-ux-header"
      title="路由管理"
      :online="true"
      @back="() => history.back()"
    />
  <div>{{ $t('generate.route-management') }}</div>
</template>

<style scoped></style>
