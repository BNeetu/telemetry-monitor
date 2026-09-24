export interface HistoryPoint {
  time: string;
  value: number;
}

export interface SensorData {
  value: number;
  unit: string;
  history: HistoryPoint[];
}

export interface DashboardResponse {
  timestamp: string;
  velocity: SensorData;
  pressure: SensorData;
  temperature: SensorData;
}

export type ParameterKey = 'velocity' | 'pressure' | 'temperature';
export type StatusLevel = 'normal' | 'warning' | 'critical';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ParameterConfig {
  key: ParameterKey;
  label: string;
  backendUnit: string;
  units: string[];
  min: number;
  max: number;
  warningLow: number;
  warningHigh: number;
  criticalLow: number;
  criticalHigh: number;
}

export interface ConvertedParameter {
  key: ParameterKey;
  label: string;
  value: number;
  unit: string;
  status: StatusLevel;
  history: HistoryPoint[];
  min: number;
  max: number;
}
