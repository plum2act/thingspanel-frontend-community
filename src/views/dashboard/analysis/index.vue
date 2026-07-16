<script lang="ts" setup>
import { useTheme } from '@/components/ux/useTheme'
import UxPageHeader from '@/components/ux/UxPageHeader.vue'
import { BottomPart, DataCard, TopChart } from './components'


const { palette } = useTheme()
</script>

<template>
    <UxPageHeader
      class="page-ux-header"
      title="仪表盘分析"
      :online="true"
      @back="() => history.back()"
    />
  <NSpace :vertical="true" :size="16">
    <TopChart />
    <DataCard />
    <BottomPart />
  </NSpace>
</template>

<style scoped></style>
