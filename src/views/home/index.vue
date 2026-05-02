<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { debounce } from 'lodash'
import { router } from '@/router'
import { useWebsocketUtil } from '@/utils/websocketUtil'
import { fetchHomeData } from '@/service/api'
import { getThingsVisHomeDashboard, type ThingsVisHomeDashboard } from '@/service/api/thingsvis'
import type { ICardRender, ICardView } from '@/components/panel/card'
import { localStg } from '@/utils/storage'
import { $t } from '@/locales'
import CardRender from '@/components/panel/ui/card-render.vue'
import ThingsVisAppFrame from '@/components/thingsvis/ThingsVisAppFrame.vue'
import { useAuthStore } from '@/store/modules/auth'
import { clearThingsVisHomeCache, readThingsVisHomeCache, writeThingsVisHomeCache } from '@/utils/thingsvis/home-cache'
import { isSysAdminUser } from '@/utils/thingsvis/space'

const layoutFetched = ref(false)
const layout = ref<ICardView[]>([])
const theme = ref('')
const isError = ref<boolean>(false)
const active = ref<boolean>(true)
const showSysAdminSetup = ref(false)
const token = localStg.get('token')
const cr = ref<ICardRender>()
const { updateComponentsData, closeAllSockets } = useWebsocketUtil(cr, token as string)
const authStore = useAuthStore()
const isSysAdmin = computed(() => isSysAdminUser(authStore.userInfo))

// ThingsVis 首页相关
const thingsVisHome = ref<ThingsVisHomeDashboard | null>(null)
const useThingsVis = ref(false)
const isThingsVisLoading = ref(false)
const isHomeResolving = computed(() => !layoutFetched.value || isThingsVisLoading.value)

function isCompleteThingsVisDashboard(dashboard?: ThingsVisHomeDashboard | null): boolean {
  if (!dashboard || !dashboard.canvasConfig || typeof dashboard.canvasConfig !== 'object') return false
  if (!Array.isArray(dashboard.nodes)) return false
  if (!Array.isArray(dashboard.dataSources)) return false
  return true
}

// 检查 ThingsVis 服务是否可用
const checkThingsVisAvailable = async (): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    const response = await fetch('/thingsvis-api/health', {
      method: 'GET',
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

// ThingsVis 请求失败时的重试状态（针对超管首次登录场景）
const thingsVisRetryCount = ref(0)
const MAX_THINGSVIS_RETRY = 5 // 增加到 5 次重试

const loadLegacyHome = async () => {
  console.log('[Home] loadLegacyHome 开始')
  const { data, error } = await fetchHomeData({})
  console.log('[Home] fetchHomeData 返回, data:', !!data, 'error:', error)

  isError.value = (error || !(data && data.config)) as boolean
  if (isError.value) {
    console.log('[Home] fetchHomeData 错误, isError:', isError.value)
    layoutFetched.value = true
    return
  }

  if (data) {
    const configJson = JSON.parse(data.config)
    console.log('[Home] configJson 类型:', Array.isArray(configJson) ? 'array' : typeof configJson)
    if (Array.isArray(configJson)) {
      updateConfigData(configJson)
      layout.value = [...configJson, ...layout.value]
      layoutFetched.value = true
      console.log('[Home] 设置 array layout, length:', layout.value.length)
    } else if (typeof configJson === 'object') {
      if (configJson.layout) {
        updateConfigData(configJson.layout)
        layout.value = configJson.layout
        layoutFetched.value = true
        console.log('[Home] 设置 object layout, length:', layout.value.length)
      }
      if (configJson.theme) {
        theme.value = configJson.theme
      }
    }
  }
}

const getLayout = async (retryCount = 0) => {
  isError.value = false
  showSysAdminSetup.value = false
  useThingsVis.value = false
  thingsVisHome.value = null
  layoutFetched.value = false
  layout.value = []
  theme.value = ''

  const cachedHome = readThingsVisHomeCache()
  if (cachedHome?.state === 'thingsvis' && isCompleteThingsVisDashboard(cachedHome.dashboard)) {
    thingsVisHome.value = cachedHome.dashboard
    useThingsVis.value = true
    layoutFetched.value = true
    return
  }
  if (cachedHome?.state === 'thingsvis') {
    clearThingsVisHomeCache()
  }

  if (cachedHome?.state === 'sysadmin-setup' && isSysAdmin.value) {
    showSysAdminSetup.value = true
    layoutFetched.value = true
    return
  }

  if (cachedHome?.state === 'classic' && !isSysAdmin.value) {
    await loadLegacyHome()
    return
  }

  // 先检查 ThingsVis 服务是否可用
  const thingsVisAvailable = await checkThingsVisAvailable()
  console.log('[Home] ThingsVis 服务可用性:', thingsVisAvailable)

  if (!thingsVisAvailable) {
    console.log('[Home] ThingsVis 服务不可用，使用原看板')
    writeThingsVisHomeCache('classic')
    await loadLegacyHome()
    console.log('[Home] loadLegacyHome 完成, layoutFetched:', layoutFetched.value, 'layout length:', layout.value.length)
    return
  }

  // ThingsVis 服务可用，检查是否有首页的仪表盘
  try {
    console.log('[Home] 尝试获取 ThingsVis 首页...')
    isThingsVisLoading.value = true
    const thingsVisResult = await getThingsVisHomeDashboard()
    isThingsVisLoading.value = false
    const homeNotConfigured =
      !thingsVisResult.data?.data && (!thingsVisResult.error || thingsVisResult.error.status === 404)
    console.log('[Home] ThingsVis 响应:', thingsVisResult)
    if (!thingsVisResult.error && thingsVisResult.data?.data) {
      console.log('[Home] 使用 ThingsVis 首页:', thingsVisResult.data.data)
      thingsVisHome.value = thingsVisResult.data.data
      useThingsVis.value = true
      layoutFetched.value = true
      thingsVisRetryCount.value = 0
      writeThingsVisHomeCache('thingsvis', thingsVisResult.data.data)
      return
    }

    // ThingsVis 服务可用但没有配置首页，使用原看板
    console.log('[Home] ThingsVis 没有设置首页，使用原看板')
    if (homeNotConfigured) {
      writeThingsVisHomeCache('classic')
    }
  } catch (e) {
    // ThingsVis 服务错误，使用原看板
    console.log('[Home] ThingsVis 服务错误，使用原看板:', e)
    isThingsVisLoading.value = false
  }

  // 使用原来的看板首页
  await loadLegacyHome()
}

onMounted(getLayout)

onUnmounted(() => {
  closeAllSockets()
})

const throttledWatcher = debounce(() => {
  updateComponentsData(layout)
}, 300)

watch(
  () => layout,
  _newLayout => {
    throttledWatcher()
  },
  { deep: true }
)

/**
 * Todo: Once all config data in server are updated to use unique number as "i" attribute, we can remove this function.
 * Convert a string to a unique number.
 *
 * @param str
 * @returns
 */
function stringToUniqueNumber(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = hash * 31 + str.charCodeAt(i)
  }
  return hash
}

/**
 * Todo: Once all config data in server are updated to use unique number as "i" attribute, we can remove this function.
 * The attribute "i" of each config data may be a string instead of a number, so we need to convert it to a unique
 * number to avoid Vue's warning.
 *
 * @param configJson
 */
function updateConfigData(configJson: ICardView[]) {
  for (const item of configJson) {
    if (typeof item.i === 'string') {
      item.i = stringToUniqueNumber(item.i)
    }
  }
}

const breakpointChanged = (_newBreakpoint: any, newLayout: any) => {
  setTimeout(() => {
    layout.value = newLayout
  }, 300)
}
</script>

<template>
  <div v-if="isHomeResolving" class="h-full w-full flex-center px-16px">
    <div class="h-full w-full"></div>
  </div>

  <div v-else-if="isError && !useThingsVis" class="h-full w-full flex-center">
    <n-result status="418" :title="$t('custom.home.title')" :description="$t('custom.home.description')">
      <template #footer>
        <n-button
          type="primary"
          :disabled="active"
          @click="
            () => {
              router.go(0)
            }
          "
        >
          <n-countdown
            v-if="active"
            :duration="60000"
            :render="props => props.seconds + 's'"
            :active="active"
            @finish="active = false"
          />
          {{ active ? '' : $t('custom.home.refresh') }}
        </n-button>
      </template>
    </n-result>
  </div>

  <div v-else-if="showSysAdminSetup" class="h-full w-full flex-center">
    <n-result
      status="info"
      title="请先配置超管首页看板"
      description="当前账号使用独立的超管看板空间。进入可视化项目，创建并将一个 ThingsVis 仪表盘设为首页后，这里会直接展示该超管看板。"
    >
      <template #footer>
        <div class="flex items-center gap-3">
          <n-button
            type="primary"
            @click="
              () => {
                router.push('/visualization/thingsvis')
              }
            "
          >
            前往可视化项目
          </n-button>
          <n-button
            @click="
              () => {
                router.go(0)
              }
            "
          >
            重新加载
          </n-button>
        </div>
      </template>
    </n-result>
  </div>

  <!-- ThingsVis 首页 -->
  <ThingsVisAppFrame
    v-else-if="useThingsVis && thingsVisHome"
    :id="thingsVisHome.id"
    :schema="thingsVisHome"
    mode="viewer"
    class="h-full w-full"
  />

  <!-- Legacy 传统看板 -->
  <CardRender
    v-else-if="layoutFetched"
    ref="cr"
    class="home-panel"
    :layout="layout"
    :is-preview="true"
    :col-num="12"
    :default-card-col="4"
    :row-height="85"
    :theme="theme"
  />
</template>

<style scoped>
.home-panel {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.5) transparent;
}
</style>
