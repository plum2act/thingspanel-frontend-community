<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <div class="ux-toolbar">
      <h2 class="ux-title">设备列表</h2>
      <div class="ux-toolbar__actions">
        <select class="ux-select" :style="selectStyle">
          <option>全部分组</option>
          <option>A 栋配电室</option>
        </select>
        <select class="ux-select" :style="selectStyle">
          <option>全部状态</option>
          <option>在线</option>
          <option>离线</option>
          <option>告警</option>
        </select>
        <button class="ux-btn ux-btn--primary" :style="{ background: palette.primary }">+ 添加设备</button>
      </div>
    </div>

    <div class="ux-table" :style="{ background: palette.bg1, borderColor: palette.border1 }">
      <div class="ux-table__head" :style="{ color: palette.text3, borderColor: palette.border1 }">
        <div>设备名</div>
        <div>编号</div>
        <div>分组</div>
        <div>状态</div>
        <div>告警</div>
        <div>协议</div>
        <div>最近上报</div>
        <div></div>
      </div>
      <div
        v-for="(d, i) in devices"
        :key="i"
        class="ux-table__row"
        :style="{ borderColor: palette.border1 }"
      >
        <div class="ux-table__name">
          <span class="ux-table__avatar" :style="{ background: palette.primaryBg, color: palette.primary }">
            {{ d.name.charAt(0) }}
          </span>
          {{ d.name }}
        </div>
        <div>{{ d.no }}</div>
        <div>{{ d.group }}</div>
        <div>
          <PxStatusBadge :type="d.online ? 'online' : 'offline'" :text="d.online ? '在线' : '离线'" />
        </div>
        <div>
          <PxStatusBadge v-if="d.warn" type="warn" :text="`${d.warnCount} 条`" />
          <span v-else :style="{ color: palette.text3 }">—</span>
        </div>
        <div><code>{{ d.proto }}</code></div>
        <div :style="{ color: palette.text3 }">{{ d.lastSeen }}</div>
        <div>
          <button class="ux-link" :style="{ color: palette.primary }">详情</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '../components/useTheme'
import PxStatusBadge from '../components/PxStatusBadge.vue'

const { palette } = useTheme()
const selectStyle = computed(() => ({
  background: palette.value.bg2,
  borderColor: palette.value.border1,
  color: palette.value.text1
}))

const devices = [
  { name: '三相智能电容器 MCCB-001', no: 'MCCB-2024-0001', group: 'A 栋配电室', online: true, warn: true, warnCount: 3, proto: 'DL/T 645', lastSeen: '12 秒前' },
  { name: '三相智能电容器 MCCB-002', no: 'MCCB-2024-0002', group: 'A 栋配电室', online: false, warn: false, warnCount: 0, proto: 'DL/T 645', lastSeen: '8 分钟前' },
  { name: '智能电表 EM-100', no: 'EM-2024-0100', group: 'B 栋总表', online: true, warn: false, warnCount: 0, proto: 'Modbus', lastSeen: '4 秒前' },
  { name: '温湿度传感器 TH-07', no: 'TH-2024-0007', group: '机房', online: true, warn: true, warnCount: 1, proto: 'MQTT', lastSeen: '1 秒前' },
  { name: '空调控制器 AC-MAIN', no: 'AC-2024-0001', group: '机房', online: true, warn: false, warnCount: 0, proto: 'CoAP', lastSeen: '20 秒前' },
  { name: 'UPS 主机 UPS-A', no: 'UPS-2024-A', group: '机房', online: true, warn: false, warnCount: 0, proto: 'Modbus', lastSeen: '5 秒前' }
]
</script>

<style lang="scss" scoped>
.ux-page {
  min-height: 100vh;
  padding: 16px 24px 32px;
}
.ux-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}
.ux-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.ux-toolbar__actions {
  display: flex;
  gap: 8px;
}
.ux-select {
  border: 1px solid;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}
.ux-btn {
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
}
.ux-link {
  background: transparent;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.ux-table {
  border: 1px solid;
  border-radius: 8px;
  overflow: hidden;
}
.ux-table__head,
.ux-table__row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1fr 1fr 1fr 1fr 0.6fr;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  font-size: 13px;
}
.ux-table__head {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid;
}
.ux-table__row {
  border-bottom: 1px solid;
}
.ux-table__row:last-child {
  border-bottom: none;
}
.ux-table__row:hover {
  background: v-bind('palette.bg3');
}
.ux-table__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.ux-table__avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
</style>