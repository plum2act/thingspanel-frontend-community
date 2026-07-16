import { extend } from 'dayjs'
import localeData from 'dayjs/plugin/localeData'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { setDayjsLocale } from '../locales/dayjs'

export function setupDayjs() {
  extend(localeData)
  extend(relativeTime)

  setDayjsLocale()
}
