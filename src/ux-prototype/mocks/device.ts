/**
 * Mock 设备 + 遥测数据
 * 数据形态对齐真实 DL/T 645 物模型字段
 */

export type TelemetryKind = 'temp' | 'analog' | 'status' | 'energy' | 'counter'

export interface MockTelemetryPoint {
  key: string
  label: string
  value: number | string
  unit: string
  kind: TelemetryKind
  /** 时间序列，用于 sparkline。ts = ms epoch */
  history: Array<{ ts: number; value: number }>
  /** status kind 时，bit 含义 */
  bitLabels?: string[]
  /** 用于 gauge ring */
  range?: [number, number]
  /** 健康等级（用于温度等） */
  level?: 'cold' | 'normal' | 'warm' | 'hot'
}

/** 生成一条轻微波动的历史曲线 */
function genHistory(seed: number, base: number, amp: number, n = 60): Array<{ ts: number; value: number }> {
  const now = Date.now()
  const out: Array<{ ts: number; value: number }> = []
  for (let i = n - 1; i >= 0; i--) {
    const t = now - i * 60_000
    const v = base + amp * Math.sin((seed + i) / 7) + (Math.random() - 0.5) * amp * 0.2
    out.push({ ts: t, value: Number(v.toFixed(2)) })
  }
  return out
}

export const mockDevice = {
  id: '8d43c2af-062c-b588-779c-312fca3ddc47',
  name: '三相智能电容器 MCCB-001',
  deviceNumber: 'MCCB-2024-0001',
  online: true,
  lastSeen: Date.now() - 12_000,
  warnCount: 3,
  diagnosis: 'normal' as 'normal' | 'warn' | 'error',
  address: 'A 栋 3 楼配电室',
  protocol: 'DL/T 645-2007'
}

/** 实时总览 3 个 KPI */
export const kpiPoints: MockTelemetryPoint[] = [
  {
    key: 'total_power',
    label: '总有功功率',
    value: 1.234,
    unit: 'MW',
    kind: 'analog',
    range: [0, 2],
    history: genHistory(1, 1.234, 0.2)
  },
  {
    key: 'total_energy',
    label: '累计电能',
    value: 12345.67,
    unit: 'kWh',
    kind: 'energy',
    history: genHistory(2, 12000, 600)
  },
  {
    key: 'phase_a_current',
    label: 'A 相电流',
    value: 235.4,
    unit: 'A',
    kind: 'analog',
    range: [0, 400],
    history: genHistory(3, 235, 40)
  }
]

/** 三相温度 */
export const tempPoints: MockTelemetryPoint[] = [
  {
    key: 'mccb_temp_a',
    label: 'A 相温度',
    value: 35.2,
    unit: '°C',
    kind: 'temp',
    level: 'normal',
    history: genHistory(11, 35, 3)
  },
  {
    key: 'mccb_temp_b',
    label: 'B 相温度',
    value: 38.6,
    unit: '°C',
    kind: 'temp',
    level: 'normal',
    history: genHistory(12, 38, 3)
  },
  {
    key: 'mccb_temp_c',
    label: 'C 相温度',
    value: 47.1,
    unit: '°C',
    kind: 'temp',
    level: 'warm',
    history: genHistory(13, 47, 3)
  }
]

/** 开关量：DI 状态 + 保护 / 模式 / 运行状态字 */
export const statusPoints: MockTelemetryPoint[] = [
  {
    key: 'mccb_di1_status',
    label: 'DI 1 输入',
    value: 0b0101, // 0x05
    unit: '',
    kind: 'status',
    bitLabels: ['DI1', 'DI2', 'DI3', 'DI4']
  },
  {
    key: 'mccb_di2_status',
    label: 'DI 2 输入',
    value: 0b1010,
    unit: '',
    kind: 'status',
    bitLabels: ['DI1', 'DI2', 'DI3', 'DI4']
  },
  {
    key: 'mccb_protect_status',
    label: '保护状态字',
    value: 0b00000101,
    unit: '',
    kind: 'status'
  },
  {
    key: 'mccb_mode_word',
    label: '模式字',
    value: 0b00000010,
    unit: '',
    kind: 'status'
  },
  {
    key: 'mccb_run_status',
    label: '运行状态字',
    value: 0b00000011,
    unit: '',
    kind: 'status'
  }
]

/** 电能 */
export const energyPoints: MockTelemetryPoint[] = [
  {
    key: 'mccb_forward_active_energy_rate2',
    label: '正向有功电能（费率 2）',
    value: 12345.67,
    unit: 'kWh',
    kind: 'energy',
    history: genHistory(20, 12345, 12)
  },
  {
    key: 'mccb_reverse_active_energy_rate2',
    label: '反向有功电能（费率 2）',
    value: 234.5,
    unit: 'kWh',
    kind: 'energy',
    history: genHistory(21, 230, 3)
  }
]

/** 模拟量：电流 / 电压 / 不平衡 */
export const analogPoints: MockTelemetryPoint[] = [
  {
    key: 'mccb_ia',
    label: 'A 相电流',
    value: 235.4,
    unit: 'A',
    kind: 'analog',
    range: [0, 400],
    history: genHistory(30, 235, 40)
  },
  {
    key: 'mccb_ib',
    label: 'B 相电流',
    value: 198.7,
    unit: 'A',
    kind: 'analog',
    range: [0, 400],
    history: genHistory(31, 199, 35)
  },
  {
    key: 'mccb_ic',
    label: 'C 相电流',
    value: 312.0,
    unit: 'A',
    kind: 'analog',
    range: [0, 400],
    history: genHistory(32, 312, 50)
  },
  {
    key: 'mccb_zero_seq_current',
    label: '零序电流',
    value: 1.2,
    unit: 'A',
    kind: 'analog',
    range: [0, 5],
    history: genHistory(33, 1.2, 0.3)
  },
  {
    key: 'mccb_unbalance',
    label: '三相不平衡',
    value: 8.5,
    unit: '%',
    kind: 'analog',
    range: [0, 15],
    history: genHistory(34, 8.5, 1.5)
  }
]

/** 计数器 */
export const counterPoints: MockTelemetryPoint[] = [
  {
    key: 'mccb_close_count',
    label: '合闸次数',
    value: 123,
    unit: '次',
    kind: 'counter',
    history: genHistory(40, 123, 0.5)
  },
  {
    key: 'mccb_fault_count',
    label: '故障次数',
    value: 5,
    unit: '次',
    kind: 'counter',
    history: genHistory(41, 5, 0.1)
  },
  {
    key: 'mccb_op_count',
    label: '操作次数',
    value: 89,
    unit: '次',
    kind: 'counter',
    history: genHistory(42, 89, 0.4)
  }
]