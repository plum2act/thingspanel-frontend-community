<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <div class="ux-toolbar">
      <h2 class="ux-title">物模型编辑器 · {{ mockTemplate.name }}</h2>
      <div class="ux-toolbar__meta">
        <span class="ux-saved" :style="{ color: palette.success }">● 已保存 3 秒前</span>
        <button class="ux-btn" :style="{ background: palette.bg2, color: palette.text1, border: `1px solid ${palette.border1}` }">
          预览 JSON
        </button>
        <button class="ux-btn ux-btn--primary" :style="{ background: palette.primary }">发布</button>
      </div>
    </div>

    <div class="ux-layout">
      <!-- 左侧 nav -->
      <aside class="ux-side" :style="{ background: palette.bg1, borderColor: palette.border1 }">
        <div class="ux-side__section">基本信息</div>
        <div class="ux-side__section">物模型字段</div>
        <ul class="ux-side__sub">
          <li v-for="s in subSections" :key="s.key" :class="{ 'is-active': activeSub === s.key }" @click="activeSub = s.key">
            <span class="ux-side__dot" :style="{ background: subBg(s.key) }"></span>
            <span>{{ s.label }}</span>
            <span class="ux-side__count">{{ s.count }}</span>
          </li>
        </ul>
        <div class="ux-side__section">图表配置</div>
        <ul class="ux-side__sub">
          <li>Web 图表</li>
          <li>App 图表</li>
          <li>大屏预览</li>
        </ul>
        <div class="ux-side__section">发布</div>
        <ul class="ux-side__sub">
          <li>JSON</li>
          <li>历史版本</li>
        </ul>
      </aside>

      <!-- 右侧主区 -->
      <main class="ux-main" :style="{ background: palette.bg1, borderColor: palette.border1 }">
        <div class="ux-main__head">
          <h3>{{ currentSubLabel }}</h3>
          <button class="ux-btn ux-btn--primary ux-btn--sm" :style="{ background: palette.primary }" @click="addRow">
            + 添加
          </button>
        </div>
        <table class="ux-tbl" :style="{ borderColor: palette.border1 }">
          <thead :style="{ background: palette.bg2, color: palette.text3 }">
            <tr>
              <th>名称</th>
              <th>标识符</th>
              <th>类型</th>
              <th>读写</th>
              <th>单位</th>
              <th>说明</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="i" :style="{ borderColor: palette.border1 }">
              <td><input class="ux-inp" :style="inpStyle" v-model="row.name" /></td>
              <td><input class="ux-inp ux-inp--mono" :style="inpStyle" v-model="row.id" /></td>
              <td>
                <select class="ux-inp" :style="inpStyle" v-model="row.type">
                  <option>Number</option><option>String</option><option>Boolean</option><option>Enum</option>
                </select>
              </td>
              <td>
                <select class="ux-inp" :style="inpStyle" v-model="row.rw">
                  <option>R</option><option>RW</option>
                </select>
              </td>
              <td><input class="ux-inp" :style="inpStyle" v-model="row.unit" /></td>
              <td><input class="ux-inp" :style="inpStyle" v-model="row.desc" /></td>
              <td>
                <button class="ux-link ux-link--danger" :style="{ color: palette.danger }">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTheme } from '../components/useTheme'
import { mockTemplate } from '../mocks/templates'

const { palette } = useTheme()
const inpStyle = computed(() => ({
  background: palette.value.bg2,
  borderColor: palette.value.border1,
  color: palette.value.text1
}))

const subSections = [
  { key: 'telemetry', label: '遥测', count: mockTemplate.telemetry.length },
  { key: 'attribute', label: '属性', count: mockTemplate.attributes.length },
  { key: 'event', label: '事件', count: mockTemplate.events.length },
  { key: 'command', label: '命令', count: mockTemplate.commands.length }
]
const activeSub = ref('telemetry')

const rows = ref(
  mockTemplate.telemetry.map(t => ({
    name: t.data_name,
    id: t.data_identifier,
    type: t.data_type,
    rw: t.read_write_flag,
    unit: t.unit,
    desc: t.description
  }))
)

const currentSubLabel = computed(() => subSections.find(s => s.key === activeSub.value)?.label || '')

function subBg(k: string) {
  switch (k) {
    case 'telemetry': return palette.value.primary
    case 'attribute': return palette.value.success
    case 'event': return palette.value.warning
    case 'command': return palette.value.danger
    default: return palette.value.text3
  }
}

function addRow() {
  rows.value.push({ name: '', id: '', type: 'Number', rw: 'R', unit: '', desc: '' })
}
</script>

<style lang="scss" scoped>
.ux-page { min-height: 100vh; padding: 16px 24px 32px; }
.ux-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
.ux-title { font-size: 20px; font-weight: 700; margin: 0; }
.ux-toolbar__meta { display: flex; align-items: center; gap: 8px; }
.ux-saved { font-size: 12px; font-weight: 600; }
.ux-btn { border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; color: #fff; }
.ux-btn--sm { padding: 4px 10px; font-size: 11px; }

.ux-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
}
@media (max-width: 880px) { .ux-layout { grid-template-columns: 1fr; } }

.ux-side {
  border: 1px solid;
  border-radius: 8px;
  padding: 12px 8px;
  align-self: start;
  position: sticky;
  top: 16px;
}
.ux-side__section {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 12px 6px;
  opacity: 0.6;
}
.ux-side__sub {
  list-style: none;
  padding: 0;
  margin: 0 0 8px;
}
.ux-side__sub li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  margin: 2px 0;
}
.ux-side__sub li:hover {
  background: v-bind('palette.bg3');
}
.ux-side__sub li.is-active {
  background: v-bind('palette.primaryBg');
  color: v-bind('palette.primary');
  font-weight: 600;
}
.ux-side__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.ux-side__count {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.6;
  background: v-bind('palette.bg3');
  padding: 0 6px;
  border-radius: 8px;
}

.ux-main {
  border: 1px solid;
  border-radius: 8px;
  overflow: hidden;
}
.ux-main__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid v-bind('palette.border1');
}
.ux-main__head h3 { margin: 0; font-size: 16px; font-weight: 700; }

.ux-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.ux-tbl th, .ux-tbl td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid;
}
.ux-tbl th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
}
.ux-inp {
  width: 100%;
  border: 1px solid;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  outline: none;
}
.ux-inp--mono { font-family: 'SF Mono', 'Menlo', monospace; font-size: 12px; }
.ux-link { background: transparent; border: none; cursor: pointer; font-weight: 600; }
</style>