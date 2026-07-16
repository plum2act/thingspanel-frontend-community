<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { NConfigProvider, darkTheme } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import json from 'highlight.js/lib/languages/json'
import hljs from 'highlight.js/lib/core'
import { useAppStore } from './store/modules/app'
import { useThemeStore } from './store/modules/theme'
import { naiveDateLocales, naiveLocales } from './locales/naive'
import Content from './components/content/index.vue'
import { uxPrototypeRoutes } from './ux-prototype/router'
import { useRouter } from 'vue-router'

hljs.registerLanguage('json', json)

defineOptions({
  name: 'App'
})

const appStore = useAppStore()
const themeStore = useThemeStore()
const router = useRouter()
const { isFullscreen, toggle } = useFullscreen()
const naiveDarkTheme = computed(() => (themeStore.darkMode ? darkTheme : undefined))

const naiveLocale = computed(() => {
  return naiveLocales[appStore.locale]
})

const naiveDateLocale = computed(() => {
  return naiveDateLocales[appStore.locale]
})

/**
 * 🔥 修复：禁用全局全屏监听器
 *
 * 原逻辑问题：当退出子元素全屏时，会误触发整个页面全屏
 * 现在：注释掉这个监听器，让各个组件自己管理全屏状态
 *
 * 原代码：
 * const handleFullScreenChange = () => {
 *   if (!document.fullscreenElement) {
 *     if (isFullscreen) {
 *       toggle()  // ❌ 会导致退出编辑器全屏后，立即进入页面全屏
 *     }
 *   }
 * }
 */

// 注释掉全局全屏监听器
// onMounted(() => {
//   document.addEventListener('fullscreenchange', handleFullScreenChange)
// })

// onBeforeUnmount(() => {
//   document.removeEventListener('fullscreenchange', handleFullScreenChange)
// })

// 注册 UX 原型路由：启动时动态注入 /ux-prototype/* 路由
// 移除整个 src/ux-prototype/ 目录即自动下线所有原型路由
onMounted(() => {
  uxPrototypeRoutes.forEach(r => router.addRoute(r))
})
</script>

<template>
  <NConfigProvider
    :hljs="hljs"
    :theme="naiveDarkTheme"
    :theme-overrides="themeStore.naiveTheme"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    class="h-full"
  >
    <NMessageProvider>
      <Content />
      <AppProvider>
        <RouterView class="bg-layout" />
      </AppProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
