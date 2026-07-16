<script lang="ts" setup>
import { useTheme } from '@/components/ux/useTheme'
import UxPageHeader from '@/components/ux/UxPageHeader.vue'
import { WorkbenchHeader, WorkbenchMain } from './components'


const { palette } = useTheme()
</script>

<template>
    <UxPageHeader
      class="page-ux-header"
      title="工作台"
      :online="true"
      @back="() => history.back()"
    />
  <NSpace :vertical="true" :size="16">
    <WorkbenchHeader />
    <WorkbenchMain />
  </NSpace>
</template>

<style scoped></style>
