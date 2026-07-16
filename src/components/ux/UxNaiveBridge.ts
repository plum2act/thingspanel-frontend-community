/**
 * Ux palette → Naive UI themeOverrides 桥接
 *
 * 把 Ux Palette 的 primary / info / success / warning / danger 5 个色派生
 * 5 阶 Naive common 调色（Color / ColorHover / ColorPressed / ColorSuppl / Active），
 * 让所有 Naive UI 原生控件（按钮 / 标签 / 卡片 / 输入 / 选择 / 表格）继承品牌色。
 *
 * 设计原则：
 * 1. 不引入循环依赖 —— 不 import useTheme，而是接受 Palette 对象
 * 2. 与现有 themeStore.naiveTheme 共存 —— App.vue 把我们的 common 合并进 theme-overrides
 * 3. 不修改 token 体系 —— 仅做 Naive common 层的颜色覆盖，5 阶派生遵循现有模式
 */

import { getColorByColorPaletteNumber } from '@sa/color-palette'
import { addColorAlpha } from '@sa/utils'
import type { Palette, ThemeName } from './tokens/ux-colors'
import { palettes } from './tokens/ux-colors'

export interface NaiveThemeBridge {
  // Naive common 调色 5 阶
  primaryColor: string
  primaryColorHover: string
  primaryColorPressed: string
  primaryColorSuppl: string
  infoColor: string
  infoColorHover: string
  infoColorPressed: string
  infoColorSuppl: string
  successColor: string
  successColorHover: string
  successColorPressed: string
  successColorSuppl: string
  warningColor: string
  warningColorHover: string
  warningColorPressed: string
  warningColorSuppl: string
  errorColor: string
  errorColorHover: string
  errorColorPressed: string
  errorColorSuppl: string
  // 体层中性色，与 Naive 不同，但要让 native 控件不突兀
  bodyColor: string
  cardColor: string
  modalColor: string
  popoverColor: string
  tableColor: string
  inputColor: string
  borderColor: string
  dividerColor: string
  textColorBase: string
  textColor1: string
  textColor2: string
  textColor3: string
  // 字号 / 圆角 等 micro-token 也同步
  borderRadius: string
  borderRadiusSmall: string
  fontSize: string
  fontSizeMini: string
}

function tone5(c: string) {
  return {
    primary: c,
    hover: getColorByColorPaletteNumber(c, 500),
    pressed: getColorByColorPaletteNumber(c, 700),
    active: addColorAlpha(c, 0.1)
  }
}

export function buildNaiveBridge(palette: Palette): NaiveThemeBridge {
  const p = tone5(palette.primary)
  const i = tone5(palette.info)
  const s = tone5(palette.success)
  const w = tone5(palette.warning)
  const e = tone5(palette.danger)
  return {
    // primary
    primaryColor: p.primary,
    primaryColorHover: p.hover,
    primaryColorPressed: p.pressed,
    primaryColorSuppl: p.primary,
    // info
    infoColor: i.primary,
    infoColorHover: i.hover,
    infoColorPressed: i.pressed,
    infoColorSuppl: i.primary,
    // success
    successColor: s.primary,
    successColorHover: s.hover,
    successColorPressed: s.pressed,
    successColorSuppl: s.primary,
    // warning
    warningColor: w.primary,
    warningColorHover: w.hover,
    warningColorPressed: w.pressed,
    warningColorSuppl: w.primary,
    // error / danger
    errorColor: e.primary,
    errorColorHover: e.hover,
    errorColorPressed: e.pressed,
    errorColorSuppl: e.primary,
    // 体层中性色
    bodyColor: palette.bg0,
    cardColor: palette.bg1,
    modalColor: palette.bg1,
    popoverColor: palette.bg1,
    tableColor: palette.bg1,
    inputColor: palette.bg2,
    borderColor: palette.border1,
    dividerColor: palette.border2,
    textColorBase: palette.text1,
    textColor1: palette.text1,
    textColor2: palette.text2,
    textColor3: palette.text3,
    // micro-token
    borderRadius: '8px',
    borderRadiusSmall: '4px',
    fontSize: '14px',
    fontSizeMini: '12px'
  }
}

/**
 * 给定 Ux ThemeName 直接拿桥接结果
 */
export function naiveBridgeForTheme(name: ThemeName): NaiveThemeBridge {
  return buildNaiveBridge(palettes[name])
}
