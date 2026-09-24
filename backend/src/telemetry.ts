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

interface SensorState {
  baseValue: number;
  currentValue: number;
  unit: string;
  history: HistoryPoint[];
  updateCount: number;
}

const MAX_HISTORY = 100;

function formatTime(date: Date): string {
  return date.toISOString().slice(11, 19);
}

function randomVariation(value: number, percent = 0.1): number {
  const factor = 1 + (Math.random() * 2 - 1) * percent;
  return value * factor;
}

function driftTowardBase(current: number, base: number, step = 0.15): number {
  return current + (base - current) * step;
}

class TelemetrySimulator {
  private velocity: SensorState = {
    baseValue: 45.2,
    currentValue: 45.2,
    unit: 'cm/s',
    history: [],
    updateCount: 0,
  };

  private pressure: SensorState = {
    baseValue: 1013.25,
    currentValue: 1013.25,
    unit: 'mbar',
    history: [],
    updateCount: 0,
  };

  private temperature: SensorState = {
    baseValue: 23.5,
    currentValue: 23.5,
    unit: '°C',
    history: [],
    updateCount: 0,
  };

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.seedHistory();
    this.start();
  }

  private seedHistory(): void {
    const now = new Date();
    for (let i = MAX_HISTORY - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 1000);
      const timeStr = formatTime(time);
      this.velocity.history.push({ time: timeStr, value: this.velocity.currentValue });
      this.pressure.history.push({ time: timeStr, value: this.pressure.currentValue });
      this.temperature.history.push({ time: timeStr, value: this.temperature.currentValue });
    }
  }

  private updateSensor(sensor: SensorState, timeStr: string): void {
    sensor.updateCount++;

    if (sensor.updateCount % 5 === 0) {
      sensor.currentValue = driftTowardBase(sensor.currentValue, sensor.baseValue);
    } else {
      sensor.currentValue = randomVariation(sensor.currentValue);
    }

    sensor.history.push({ time: timeStr, value: Number(sensor.currentValue.toFixed(2)) });
    if (sensor.history.length > MAX_HISTORY) {
      sensor.history.shift();
    }
  }

  private tick(): void {
    const timeStr = formatTime(new Date());
    this.updateSensor(this.velocity, timeStr);
    this.updateSensor(this.pressure, timeStr);
    this.updateSensor(this.temperature, timeStr);
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getDashboard(): DashboardResponse {
    return {
      timestamp: new Date().toISOString(),
      velocity: {
        value: Number(this.velocity.currentValue.toFixed(2)),
        unit: this.velocity.unit,
        history: [...this.velocity.history],
      },
      pressure: {
        value: Number(this.pressure.currentValue.toFixed(2)),
        unit: this.pressure.unit,
        history: [...this.pressure.history],
      },
      temperature: {
        value: Number(this.temperature.currentValue.toFixed(2)),
        unit: this.temperature.unit,
        history: [...this.temperature.history],
      },
    };
  }
}

export const telemetrySimulator = new TelemetrySimulator();
