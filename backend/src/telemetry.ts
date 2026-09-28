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

function randomVariation(value: number, percent = 0.025): number {
  const factor = 1 + (Math.random() * 2 - 1) * percent;
  return value * factor;
}

function driftTowardBase(current: number, base: number, step = 0.4): number {
  return current + (base - current) * step;
}

// Hard safety bound so a long-running unlucky streak can never wander into
// physically implausible territory (e.g. pressure reading in the hundreds of
// mbar off nominal). In practice the drift/reversion cycle keeps values well
// inside this band; it only ever engages on rare, extended runs.
function clampToSafeBand(value: number, base: number, band = 0.22): number {
  const lo = base * (1 - band);
  const hi = base * (1 + band);
  return Math.min(hi, Math.max(lo, value));
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
    this.seedSensor(this.velocity, now);
    this.seedSensor(this.pressure, now);
    this.seedSensor(this.temperature, now);
  }

  private seedSensor(sensor: SensorState, now: Date): void {
    // Run the same update rule used for live ticks, starting from the
    // baseline 100 "seconds" ago, so the chart already looks like a live
    // signal on first load instead of a flat line — and so the seeded data
    // has the same statistical shape as data the server would have produced
    // if it had actually been running that whole time.
    let value = sensor.baseValue;
    for (let i = MAX_HISTORY - 1; i >= 0; i--) {
      const step = MAX_HISTORY - i;
      if (step % 5 === 0) {
        value = driftTowardBase(value, sensor.baseValue);
      } else {
        value = randomVariation(value);
      }
      value = clampToSafeBand(value, sensor.baseValue);

      const time = new Date(now.getTime() - i * 1000);
      sensor.history.push({ time: formatTime(time), value: Number(value.toFixed(2)) });
    }

    sensor.currentValue = value;
    sensor.updateCount = MAX_HISTORY;
  }

  private updateSensor(sensor: SensorState, timeStr: string): void {
    sensor.updateCount++;

    if (sensor.updateCount % 5 === 0) {
      sensor.currentValue = driftTowardBase(sensor.currentValue, sensor.baseValue);
    } else {
      sensor.currentValue = randomVariation(sensor.currentValue);
    }
    sensor.currentValue = clampToSafeBand(sensor.currentValue, sensor.baseValue);

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
