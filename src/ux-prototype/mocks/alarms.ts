/**
 * Mock 告警
 */
export type AlarmLevel = 'critical' | 'warning' | 'info'

export interface MockAlarm {
  id: string
  ts: number
  level: AlarmLevel
  title: string
  detail: string
  source: string
  status: 'active' | 'recovered'
}

export const mockAlarms: MockAlarm[] = [
  {
    id: 'a1',
    ts: Date.now() - 4 * 60_000,
    level: 'critical',
    title: '过流保护动作',
    detail: 'A 相电流 235A，超过阈值 200A',
    source: 'MCCB-2024-0001',
    status: 'active'
  },
  {
    id: 'a2',
    ts: Date.now() - 8 * 60_000,
    level: 'warning',
    title: '通信中断',
    detail: 'MQTT 心跳丢失，持续 3 分钟',
    source: 'MCCB-2024-0002',
    status: 'recovered'
  },
  {
    id: 'a3',
    ts: Date.now() - 27 * 60_000,
    level: 'warning',
    title: '三相不平衡告警',
    detail: '8.5% > 阈值 5%',
    source: 'MCCB-2024-0001',
    status: 'active'
  },
  {
    id: 'a4',
    ts: Date.now() - 60 * 60_000,
    level: 'info',
    title: '设备上线',
    detail: 'MCCB-2024-0003 上线',
    source: 'MCCB-2024-0003',
    status: 'recovered'
  },
  {
    id: 'a5',
    ts: Date.now() - 2 * 60 * 60_000,
    level: 'critical',
    title: '温度越限',
    detail: 'C 相温度 47.1°C，超过告警阈值 45°C',
    source: 'MCCB-2024-0001',
    status: 'active'
  },
  {
    id: 'a6',
    ts: Date.now() - 3 * 60 * 60_000,
    level: 'warning',
    title: '电能清零',
    detail: '费率切换导致累积清零',
    source: 'MCCB-2024-0002',
    status: 'recovered'
  }
]