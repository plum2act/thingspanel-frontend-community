/**
 * 原型路由：作为独立 mini-router 挂在主 router 下，
 * 通过 App.vue 启动时调用 addRoute 注入，删除即下线全部原型。
 */
import type { RouteRecordRaw } from 'vue-router'

export const uxPrototypeRoutes: RouteRecordRaw[] = [
  {
    path: '/ux-prototype',
    component: () => import('./views/Index.vue'),
    meta: { title: 'UX 原型库' }
  },
  {
    path: '/ux-prototype/dashboard',
    component: () => import('./views/Dashboard.vue'),
    meta: { title: '首页 / 系统总览' }
  },
  {
    path: '/ux-prototype/devices',
    component: () => import('./views/DeviceList.vue'),
    meta: { title: '设备列表' }
  },
  {
    path: '/ux-prototype/device/:id/telemetry',
    component: () => import('./views/DeviceTelemetry.vue'),
    meta: { title: '设备详情 - 遥测' }
  },
  {
    path: '/ux-prototype/device/:id/alarms',
    component: () => import('./views/DeviceAlarms.vue'),
    meta: { title: '设备详情 - 告警' }
  },
  {
    path: '/ux-prototype/device/:id/events',
    component: () => import('./views/DeviceEvents.vue'),
    meta: { title: '设备详情 - 事件流' }
  },
  {
    path: '/ux-prototype/alarm-center',
    component: () => import('./views/AlarmCenter.vue'),
    meta: { title: '告警中心' }
  },
  {
    path: '/ux-prototype/template-editor',
    component: () => import('./views/TemplateEditor.vue'),
    meta: { title: '物模型编辑器 - 单页版' }
  },
  {
    path: '/ux-prototype/template-editor-wizard',
    component: () => import('./views/TemplateEditorWizard.vue'),
    meta: { title: '物模型编辑器 - Wizard 版' }
  },
  {
    path: '/ux-prototype/chart-config',
    component: () => import('./views/ChartConfig.vue'),
    meta: { title: '图表配置' }
  }
]