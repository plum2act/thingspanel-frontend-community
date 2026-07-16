<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 15:24:25
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 16:43:27
-->
<script setup lang="tsx">
import { useTheme } from '@/components/ux/useTheme'
import UxPageHeader from '@/components/ux/UxPageHeader.vue'
import { $t } from '@/locales'
import AlarmConfiguration from './components/alarm-configuration.vue'
import NewInformation from './components/new-information.vue'


const { palette } = useTheme()
</script>

<template>
    <UxPageHeader
      class="page-ux-header"
      title="告警中心"
      :online="true"
      @back="() => history.back()"
    />
  <div class="table-box">
    <NCard :title="$t('generate.alarm-center')">
      <n-tabs type="line" size="large">
        <n-tab-pane :name="$t('generate.alarmInfo')" :tag="$t('generate.alarmInfo')">
          <AlarmConfiguration />
        </n-tab-pane>
        <n-tab-pane :name="$t('generate.alarmConfig')" :tag="$t('generate.alarmConfig')">
          <NewInformation />
        </n-tab-pane>
      </n-tabs>
    </NCard>
  </div>
</template>

<style scoped></style>
