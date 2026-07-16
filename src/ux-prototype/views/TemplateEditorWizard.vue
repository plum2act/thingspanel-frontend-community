<template>
  <div class="ux-page" :style="{ background: palette.bg0, color: palette.text1 }">
    <div class="ux-modal" :style="{ background: palette.bg1, borderColor: palette.border1 }">
      <!-- 步骤条 -->
      <div class="ux-steps" :style="{ borderColor: palette.border1 }">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="ux-step"
          :class="{ 'is-active': step === i + 1, 'is-done': step > i + 1 }"
          @click="step = i + 1"
        >
          <span class="ux-step__num">{{ i + 1 }}</span>
          <span class="ux-step__label">{{ s }}</span>
        </div>
      </div>

      <!-- 步骤内容 -->
      <div class="ux-step-body">
        <div v-if="step === 1">
          <h3>基本信息</h3>
          <div class="ux-form">
            <label>模板名<input class="ux-inp" :style="inpStyle" v-model="basic.name" /></label>
            <label>标签
              <div class="ux-tags">
                <span v-for="(t, i) in basic.tags" :key="i" class="ux-tag" :style="{ background: palette.primaryBg, color: palette.primary }">
                  {{ t }} <button @click="basic.tags.splice(i, 1)">×</button>
                </span>
                <button class="ux-tag-add" :style="{ borderColor: palette.border1 }" @click="basic.tags.push('新标签')">+</button>
              </div>
            </label>
            <label>作者<input class="ux-inp" :style="inpStyle" v-model="basic.author" /></label>
            <label>版本<input class="ux-inp" :style="inpStyle" v-model="basic.version" /></label>
            <label>说明<textarea class="ux-inp" :style="inpStyle" v-model="basic.desc" rows="3"></textarea></label>
          </div>
        </div>

        <div v-else-if="step === 2">
          <h3>物模型定义</h3>
          <p class="ux-hint">包含 4 个子表：遥测 / 属性 / 事件 / 命令。每个子表单独立 modal 弹出。</p>
          <div class="ux-tabs" :style="{ borderColor: palette.border1 }">
            <span v-for="t in ['遥测', '属性', '事件', '命令']" :key="t" class="ux-tab">{{ t }}</span>
          </div>
          <table class="ux-tbl" :style="{ borderColor: palette.border1 }">
            <thead :style="{ color: palette.text3 }">
              <tr><th>名称</th><th>标识符</th><th>类型</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="(t, i) in mockTemplate.telemetry" :key="i" :style="{ borderColor: palette.border1 }">
                <td>{{ t.data_name }}</td>
                <td><code>{{ t.data_identifier }}</code></td>
                <td>{{ t.data_type }}</td>
                <td><button class="ux-link" :style="{ color: palette.primary }">编辑</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else-if="step === 3 || step === 4">
          <h3>{{ step === 3 ? 'Web 图表配置' : 'App 图表配置' }}</h3>
          <p class="ux-hint">嵌入 ThingsVis Studio 编辑器（mock）</p>
          <div class="ux-iframe" :style="{ background: palette.bg2, borderColor: palette.border1 }">
            <span :style="{ color: palette.text3 }">ThingsVis Studio iframe</span>
          </div>
        </div>

        <div v-else>
          <h3>发布</h3>
          <pre class="ux-json" :style="{ background: palette.bg2, borderColor: palette.border1 }">{{ JSON.stringify(mockTemplate, null, 2) }}</pre>
        </div>
      </div>

      <!-- 步骤底部按钮 -->
      <div class="ux-step-foot" :style="{ borderColor: palette.border1 }">
        <button class="ux-btn" :style="{ background: palette.bg2, color: palette.text1, border: `1px solid ${palette.border1}` }" @click="step = 1">取消</button>
        <span style="flex: 1"></span>
        <button class="ux-btn" :style="{ background: palette.bg2, color: palette.text1, border: `1px solid ${palette.border1}` }" :disabled="step === 1" @click="step--">上一步</button>
        <button class="ux-btn ux-btn--primary" :style="{ background: palette.primary }" @click="step++">{{ step === 5 ? '完成' : '下一步' }}</button>
      </div>
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

const step = ref(1)
const steps = ['基本信息', '物模型定义', 'Web 图表', 'App 图表', '发布']

const basic = ref({
  name: mockTemplate.name,
  tags: ['DL/T 645', '电容器'],
  author: mockTemplate.author,
  version: mockTemplate.version,
  desc: mockTemplate.description
})
</script>

<style lang="scss" scoped>
.ux-page { min-height: 100vh; padding: 24px; }
.ux-modal {
  max-width: 900px;
  margin: 0 auto;
  border: 1px solid;
  border-radius: 12px;
  overflow: hidden;
}
.ux-steps {
  display: flex;
  border-bottom: 1px solid;
  padding: 12px 16px;
  gap: 4px;
  overflow-x: auto;
}
.ux-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
}
.ux-step.is-active { background: v-bind('palette.primaryBg'); color: v-bind('palette.primary'); font-weight: 700; }
.ux-step.is-done .ux-step__num { background: v-bind('palette.success'); color: #fff; }
.ux-step__num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  background: v-bind('palette.bg3');
}
.ux-step.is-active .ux-step__num { background: v-bind('palette.primary'); color: #fff; }

.ux-step-body { padding: 24px; min-height: 320px; }
.ux-step-body h3 { margin: 0 0 12px; font-size: 16px; font-weight: 700; }
.ux-hint { font-size: 12px; opacity: 0.7; margin-bottom: 12px; }
.ux-form { display: flex; flex-direction: column; gap: 12px; }
.ux-form label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; }
.ux-inp {
  border: 1px solid;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
}
.ux-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.ux-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
.ux-tag button { background: transparent; border: none; cursor: pointer; color: inherit; }
.ux-tag-add { background: transparent; border: 1px dashed; border-radius: 10px; padding: 2px 8px; cursor: pointer; }

.ux-tabs { display: flex; gap: 4px; border-bottom: 1px solid; margin-bottom: 12px; }
.ux-tab { padding: 8px 12px; font-size: 13px; cursor: pointer; }

.ux-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.ux-tbl th, .ux-tbl td { text-align: left; padding: 8px 12px; border-bottom: 1px solid; }
.ux-tbl th { font-size: 11px; text-transform: uppercase; }
.ux-link { background: transparent; border: none; cursor: pointer; font-weight: 600; }

.ux-iframe {
  border: 1px dashed;
  border-radius: 8px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ux-json {
  border: 1px solid;
  border-radius: 6px;
  padding: 12px;
  font-size: 11px;
  font-family: 'SF Mono', 'Menlo', monospace;
  white-space: pre-wrap;
  max-height: 320px;
  overflow: auto;
}

.ux-step-foot {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid;
  align-items: center;
}
.ux-btn { border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; color: #fff; }
.ux-btn--primary { background: v-bind('palette.primary') !important; }
.ux-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>