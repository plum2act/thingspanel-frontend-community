import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { $t } from '@/locales'

// relativeTime 通常由 src/plugins/dayjs.ts 的 setupDayjs() 全局注册；
// 这里做一次 guard，防止该工具在 setupDayjs 之前被调用时降级（重复 extend 无副作用）。
let relativeReady = false
function ensureRelative() {
  if (relativeReady) return
  try {
    dayjs.extend(relativeTime)
    relativeReady = true
  } catch {
    /* ignore */
  }
}

/**
 * 将时间戳格式化为 YYYY-MM-DD HH:mm:ss 格式的字符串（24小时制）
 *
 * @param {string | null | undefined} ts - 时间戳
 * @returns {string | null} - 格式化后的时间字符串
 */
export function formatDateTime(ts: string | null | undefined): string | null {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : null
}

/**
 * 相对时间格式化：「刚刚」/「3 分钟前」/「2 小时前」
 * - 与 now 相差不足 1 分钟，返回 i18n 的 time.justNow（刚刚 / Just now）
 * - 否则返回 dayjs.fromNow()
 * - 空或无效时间返回 '-'
 *
 * @param ts 时间戳（字符串/数值/null/undefined）
 */
export function formatRelativeTime(ts: string | number | null | undefined): string {
  if (!ts) return '-'
  ensureRelative()
  const t = dayjs(ts)
  if (!t.isValid()) return '-'
  const now = dayjs()
  if (now.diff(t, 'minute') < 1) return $t('time.justNow')
  return t.fromNow()
}
