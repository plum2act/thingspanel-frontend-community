<script setup lang="ts">
import { useTheme } from '@/components/ux/useTheme'
import UxPageHeader from '@/components/ux/UxPageHeader.vue'
import { $t } from '@/locales'


const { palette } = useTheme()
</script>

<template>
    <UxPageHeader
      class="page-ux-header"
      title="可视化面板"
      :online="true"
      @back="() => history.back()"
    />
  <div>{{ $t('generate.migrate-dashboard-to-visualization') }}</div>
</template>
