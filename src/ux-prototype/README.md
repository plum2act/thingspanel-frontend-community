# UX 原型库

基于 Figma Community + ThingsBoard / Grafana / 华为/阿里 IoT / Datadog / New Relic 等参考设计的 ThingsPanel 高保真原型。

## 启动

访问路由 `/ux-prototype` 即可。所有数据为 mock，不接入业务 API。

- `/ux-prototype` 原型导航
- `/ux-prototype/dashboard` 首页 / 系统总览
- `/ux-prototype/devices` 设备列表
- `/ux-prototype/device/:id/telemetry` **设备详情 - 遥测（核心）**
- `/ux-prototype/device/:id/alarms` 设备详情 - 告警
- `/ux-prototype/device/:id/events` 设备详情 - 事件流
- `/ux-prototype/alarm-center` 告警中心
- `/ux-prototype/template-editor` 物模型编辑器 - 单页 side-nav 版（推荐）
- `/ux-prototype/template-editor-wizard` 物模型编辑器 - 5 步 wizard 改造版（对比）
- `/ux-prototype/chart-config` 图表配置

## 双主题

每个原型页右上角（或原型导航页）支持 light / dark 切换。状态保存在 `localStorage['ux-prototype-theme']`。

- **Light**：白底 + 边框、SCADA 风格浅色
- **Dark**：Figma "Industrial Dark Dashboard" 风格，深蓝近黑 + 电光蓝强调

## 设计参考

详见调研报告：`/Users/alexli/.claude/plans/swirling-launching-pelican-agent-a37446ac5280382f1.md`

## 移除

不需要时直接删除 `src/ux-prototype/` 整个目录即可。原型路由通过 `App.vue` 启动时动态注入（`router.addRoute`），删除目录后所有 `/ux-prototype/*` 路由 404，对其他功能零影响。