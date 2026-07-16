<script lang="tsx" setup>
import { useTheme } from '@/components/ux/useTheme'
import UxPageHeader from '@/components/ux/UxPageHeader.vue'
import DataList from '@/views/automation/scene-linkage/modules/dataList.vue'


const { palette } = useTheme()
</script>

<template>
    <UxPageHeader
      class="page-ux-header"
      title="场景联动"
      :online="true"
      @back="() => history.back()"
    />
  <div class="w-full">
    <DataList></DataList>
  </div>
</template>

<style scoped lang="scss"></style>
