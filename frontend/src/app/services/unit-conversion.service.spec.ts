import { UnitConversionService } from './unit-conversion.service';

describe('UnitConversionService', () => {
  let service: UnitConversionService;

  beforeEach(() => {
    service = new UnitConversionService();
  });

  it('uses the backend unit as the default selected unit', () => {
    expect(service.getSelectedUnit('velocity')).toBe('cm/s');
    expect(service.getSelectedUnit('pressure')).toBe('mbar');
    expect(service.getSelectedUnit('temperature')).toBe('°C');
  });

  it('converts velocity from cm/s to supported units', () => {
    expect(service.convertValue(100, 'velocity', 'mm/s')).toBeCloseTo(1000);
    expect(service.convertValue(100, 'velocity', 'm/s')).toBeCloseTo(1);
    expect(service.convertValue(100, 'velocity', 'km/h')).toBeCloseTo(3.6);
    expect(service.convertValue(100, 'velocity', 'ft/s')).toBeCloseTo(3.28084);
  });

  it('converts pressure from mbar to supported units', () => {
    expect(service.convertValue(1000, 'pressure', 'Pa')).toBeCloseTo(100000);
    expect(service.convertValue(1000, 'pressure', 'kPa')).toBeCloseTo(100);
    expect(service.convertValue(1000, 'pressure', 'bar')).toBeCloseTo(1);
    expect(service.convertValue(1000, 'pressure', 'psi')).toBeCloseTo(14.5038);
    expect(service.convertValue(1000, 'pressure', 'atm')).toBeCloseTo(0.986923);
  });

  it('converts temperature from Celsius to Fahrenheit and Kelvin', () => {
    expect(service.convertValue(25, 'temperature', '°F')).toBeCloseTo(77);
    expect(service.convertValue(25, 'temperature', 'K')).toBeCloseTo(298.15);
  });

  it('uses the selected unit when no target unit is provided', () => {
    service.setSelectedUnit('velocity', 'm/s');

    expect(service.getSelectedUnit('velocity')).toBe('m/s');
    expect(service.convertValue(250, 'velocity')).toBeCloseTo(2.5);
  });

  it('converts thresholds using the same rules as values', () => {
    expect(service.convertThreshold(1000, 'pressure', 'kPa')).toBeCloseTo(100);
  });
});