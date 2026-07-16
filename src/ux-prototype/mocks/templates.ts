/**
 * Mock 物模型
 */
export interface MockTelemetryDef {
  data_name: string
  data_identifier: string
  data_type: 'Number' | 'String' | 'Boolean' | 'Enum'
  read_write_flag: 'R' | 'RW'
  unit: string
  description: string
}

export interface MockAttributeDef extends MockTelemetryDef {}

export interface MockEventDef {
  eventName: string
  eventIdentifier: string
  params: string
  description: string
}

export interface MockCommandDef extends MockEventDef {}

export const mockTemplate = {
  name: '三相智能电容器',
  version: '1.0.0',
  author: 'KyEMS 研发部',
  description: 'DL/T 645-2007 三相智能电容器物模型',
  telemetry: [
    {
      data_name: 'A 相温度',
      data_identifier: 'mccb_temp_a',
      data_type: 'Number',
      read_write_flag: 'R',
      unit: '°C',
      description: 'A 相温度，Int16 LE × 0.1'
    },
    {
      data_name: '正向有功电能（费率 2）',
      data_identifier: 'mccb_forward_active_energy_rate2',
      data_type: 'Number',
      read_write_flag: 'R',
      unit: 'kWh',
      description: 'BCD4 × 0.01，LSB-pair-first'
    }
  ] as MockTelemetryDef[],
  attributes: [] as MockAttributeDef[],
  events: [
    {
      eventName: '过流告警',
      eventIdentifier: 'over_current',
      params: 'phase,current',
      description: '电流越限触发'
    }
  ] as MockEventDef[],
  commands: [
    {
      commandName: '远程合闸',
      commandIdentifier: 'remote_close',
      params: 'confirm',
      description: '远程合闸指令'
    }
  ] as MockCommandDef[]
}