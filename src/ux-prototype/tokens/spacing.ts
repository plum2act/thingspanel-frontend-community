/**
 * 间距 / 圆角 Token
 */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px'
} as const

export const radius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px'
} as const

export const shadow = (theme: 'light' | 'dark') =>
  theme === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.35)'
    : '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)'