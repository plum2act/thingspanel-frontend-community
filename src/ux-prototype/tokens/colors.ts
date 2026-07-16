/**
 * 颜色 Token — 双主题 (light / dark)
 *
 * 深色调参考 Figma "Industrial Dark Dashboard"（SCADA 风格）；
 * 浅色调保留 Naive UI 白底 + 边框 + 圆角风格，统一品牌色。
 *
 * 主题切换在原型 App.vue 通过 `data-theme` 切换。
 */

export type ThemeName = 'light' | 'dark'

export interface Palette {
  // 背景层级
  bg0: string  // 页面底色
  bg1: string  // 卡片
  bg2: string  // 嵌套卡片
  bg3: string  // 高亮 hover
  // 文本
  text1: string // 主文本
  text2: string // 次要
  text3: string // 弱化
  // 边框
  border1: string
  border2: string
  // 品牌色（重定义，避开 #646cff 默认值）
  primary: string
  primaryBg: string
  // 语义色
  success: string
  warning: string
  danger: string
  info: string
  // 三相配色（A 红 / B 绿 / C 蓝）
  phaseA: string
  phaseB: string
  phaseC: string
  // sparkline
  spark: string
  sparkFill: string
}

export const palettes: Record<ThemeName, Palette> = {
  light: {
    bg0: '#f5f7fa',
    bg1: '#ffffff',
    bg2: '#fafbfc',
    bg3: '#eef0f4',
    text1: '#1f2937',
    text2: '#4b5563',
    text3: '#9ca3af',
    border1: '#e5e7eb',
    border2: '#d1d5db',
    primary: '#0a6cff',     // 替换默认 #646cff
    primaryBg: 'rgba(10, 108, 255, 0.08)',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    phaseA: '#ef4444',
    phaseB: '#10b981',
    phaseC: '#3b82f6',
    spark: '#0a6cff',
    sparkFill: 'rgba(10, 108, 255, 0.12)'
  },
  dark: {
    bg0: '#0a0e1a',          // 深蓝近黑 SCADA 底色
    bg1: '#111827',          // 卡片
    bg2: '#1f2937',          // 嵌套
    bg3: '#374151',          // hover
    text1: '#f3f4f6',
    text2: '#d1d5db',
    text3: '#6b7280',
    border1: '#1f2937',
    border2: '#374151',
    primary: '#38bdf8',      // 电光蓝
    primaryBg: 'rgba(56, 189, 248, 0.12)',
    success: '#22c55e',
    warning: '#facc15',
    danger: '#f87171',
    info: '#60a5fa',
    phaseA: '#f87171',
    phaseB: '#22c55e',
    phaseC: '#60a5fa',
    spark: '#38bdf8',
    sparkFill: 'rgba(56, 189, 248, 0.18)'
  }
}

export const getPalette = (t: ThemeName) => palettes[t]