import { Injectable } from '@angular/core';
import { ParameterConfig, ParameterKey } from '../models/telemetry.model';

@Injectable({ providedIn: 'root' })
export class UnitConversionService {
  readonly parameterConfigs: Record<ParameterKey, ParameterConfig> = {
    velocity: {
      key: 'velocity',
      label: 'Velocity',
      backendUnit: 'cm/s',
      units: ['mm/s', 'cm/s', 'm/s', 'km/h', 'ft/s'],
      min: 0,
      max: 100,
      warningLow: 20,
      warningHigh: 75,
      criticalLow: 10,
      criticalHigh: 90,
    },
    pressure: {
      key: 'pressure',
      label: 'Pressure',
      backendUnit: 'mbar',
      units: ['Pa', 'kPa', 'mbar', 'bar', 'psi', 'atm'],
      min: 900,
      max: 1100,
      warningLow: 970,
      warningHigh: 1050,
      criticalLow: 950,
      criticalHigh: 1070,
    },
    temperature: {
      key: 'temperature',
      label: 'Temperature',
      backendUnit: '°C',
      units: ['°C', '°F', 'K'],
      min: 0,
      max: 50,
      warningLow: 15,
      warningHigh: 32,
      criticalLow: 10,
      criticalHigh: 40,
    },
  };

  private selectedUnits: Record<ParameterKey, string> = {
    velocity: 'cm/s',
    pressure: 'mbar',
    temperature: '°C',
  };

  getSelectedUnit(key: ParameterKey): string {
    return this.selectedUnits[key];
  }

  setSelectedUnit(key: ParameterKey, unit: string): void {
    this.selectedUnits[key] = unit;
  }

  convertValue(value: number, key: ParameterKey, targetUnit?: string): number {
    const unit = targetUnit ?? this.selectedUnits[key];
    const baseUnit = this.parameterConfigs[key].backendUnit;
    const baseValue = this.toBaseUnit(value, baseUnit, key);
    return this.fromBaseUnit(baseValue, unit, key);
  }

  convertThreshold(threshold: number, key: ParameterKey, targetUnit?: string): number {
    return this.convertValue(threshold, key, targetUnit);
  }

  private toBaseUnit(value: number, fromUnit: string, key: ParameterKey): number {
    switch (key) {
      case 'velocity':
        return this.velocityToCmPerS(value, fromUnit);
      case 'pressure':
        return this.pressureToMbar(value, fromUnit);
      case 'temperature':
        return this.temperatureToCelsius(value, fromUnit);
    }
  }

  private fromBaseUnit(baseValue: number, toUnit: string, key: ParameterKey): number {
    switch (key) {
      case 'velocity':
        return this.cmPerSToUnit(baseValue, toUnit);
      case 'pressure':
        return this.mbarToUnit(baseValue, toUnit);
      case 'temperature':
        return this.celsiusToUnit(baseValue, toUnit);
    }
  }

  private velocityToCmPerS(value: number, unit: string): number {
    const map: Record<string, number> = {
      'mm/s': 0.1,
      'cm/s': 1,
      'm/s': 100,
      'km/h': 1 / 0.036,
      'ft/s': 1 / 0.0328084,
    };
    return value * (map[unit] ?? 1);
  }

  private cmPerSToUnit(value: number, unit: string): number {
    const map: Record<string, number> = {
      'mm/s': 10,
      'cm/s': 1,
      'm/s': 0.01,
      'km/h': 0.036,
      'ft/s': 0.0328084,
    };
    return value * (map[unit] ?? 1);
  }

  private pressureToMbar(value: number, unit: string): number {
    const map: Record<string, number> = {
      Pa: 0.01,
      kPa: 10,
      mbar: 1,
      bar: 1000,
      psi: 1 / 0.0145038,
      atm: 1 / 0.000986923,
    };
    return value * (map[unit] ?? 1);
  }

  private mbarToUnit(value: number, unit: string): number {
    const map: Record<string, number> = {
      Pa: 100,
      kPa: 0.1,
      mbar: 1,
      bar: 0.001,
      psi: 0.0145038,
      atm: 0.000986923,
    };
    return value * (map[unit] ?? 1);
  }

  private temperatureToCelsius(value: number, unit: string): number {
    if (unit === '°F') return ((value - 32) * 5) / 9;
    if (unit === 'K') return value - 273.15;
    return value;
  }

  private celsiusToUnit(value: number, unit: string): number {
    if (unit === '°F') return (value * 9) / 5 + 32;
    if (unit === 'K') return value + 273.15;
    return value;
  }
}
