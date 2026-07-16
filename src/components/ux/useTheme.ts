/**
 * 主题切换 — 通过 document.documentElement.dataset.theme 切换
 * 暴露 useTheme() 给组件使用
 */
import { ref, computed, watchEffect } from 'vue'
import { palettes, type ThemeName, type Palette } from './tokens/ux-colors'

const STORAGE_KEY = 'ux-theme'
const theme = ref<ThemeName>(
  ((typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as ThemeName) || 'light'
)

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme.value
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme.value)
  }
})

export function useTheme() {
  return {
    themeName: computed<ThemeName>(() => theme.value),
    theme,
    palette: computed<Palette>(() => palettes[theme.value]),
    toggle: () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
    }
  }
}