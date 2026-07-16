/**
 * Mock 事件流
 */
export interface MockEvent {
  id: string
  ts: number
  type: 'online' | 'offline' | 'config' | 'firmware' | 'alarm'
  title: string
  detail: string
  actor: string
}

export const mockEvents: MockEvent[] = [
  {
    id: 'e1',
    ts: Date.now() - 15 * 60_000,
    type: 'config',
    title: '修改告警阈值',
    detail: '过流阈值从 180A 调整为 200A',
    actor: 'admin@thingspanel.io'
  },
  {
    id: 'e2',
    ts: Date.now() - 45 * 60_000,
    type: 'firmware',
    title: '固件升级',
    detail: 'v1.2.3 → v1.2.4',
    actor: 'ops@thingspanel.io'
  },
  {
    id: 'e3',
    ts: Date.now() - 2 * 60 * 60_000,
    type: 'online',
    title: '设备上线',
    detail: 'MQTT CONNECT OK',
    actor: 'system'
  },
  {
    id: 'e4',
    ts: Date.now() - 4 * 60 * 60_000,
    type: 'offline',
    title: '设备下线',
    detail: 'MQTT DISCONNECT（网络超时）',
    actor: 'system'
  }
]