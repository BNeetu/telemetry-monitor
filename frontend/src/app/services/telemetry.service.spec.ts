import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DashboardResponse } from '../models/telemetry.model';
import { environment } from '../../environments/environment';
import { TelemetryService } from './telemetry.service';
import { UnitConversionService } from './unit-conversion.service';

describe('TelemetryService', () => {
  const apiUrl = `${environment.apiBaseUrl}/api/dashboard`;
  const dashboardResponse: DashboardResponse = {
    timestamp: '2026-09-28T12:00:00.000Z',
    velocity: {
      value: 45.2,
      unit: 'cm/s',
      history: [{ time: '12:00:00', value: 44.8 }],
    },
    pressure: {
      value: 1013.25,
      unit: 'mbar',
      history: [{ time: '12:00:00', value: 1012.8 }],
    },
    temperature: {
      value: 23.5,
      unit: '°C',
      history: [{ time: '12:00:00', value: 23.4 }],
    },
  };

  let service: TelemetryService;
  let httpTestingController: HttpTestingController;
  let unitConversionService: UnitConversionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TelemetryService,
        UnitConversionService,
      ],
    });

    service = TestBed.inject(TelemetryService);
    httpTestingController = TestBed.inject(HttpTestingController);
    unitConversionService = TestBed.inject(UnitConversionService);
  });

  afterEach(() => {
    service.stopPolling();
    httpTestingController.verify();
  });

  it('maps a successful API response into connected dashboard parameters', fakeAsync(() => {
    service.startPolling();
    httpTestingController.expectOne(apiUrl).flush(dashboardResponse);

    expect(service.connectionStatus.value).toBe('connected');
    expect(service.loading.value).toBe(false);
    expect(service.rawData.value).toEqual(dashboardResponse);
    expect(service.parameters.value.length).toBe(3);
    expect(service.parameters.value[0].value).toBe(45.2);
    expect(service.parameters.value[0].status).toBe('normal');

    unitConversionService.setSelectedUnit('velocity', 'm/s');
    service.onUnitChanged();
    expect(service.parameters.value[0].value).toBe(0.45);
    expect(service.parameters.value[0].unit).toBe('m/s');

    service.stopPolling();
    tick(1000);
    httpTestingController.expectNone(apiUrl);
  }));

  it('sets an error state when the API request fails', fakeAsync(() => {
    service.startPolling();
    httpTestingController.expectOne(apiUrl).flush('Service unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(service.connectionStatus.value).toBe('error');
    expect(service.loading.value).toBe(false);
    expect(service.errorMessage.value).toContain('503');
    expect(service.rawData.value).toBeNull();

    service.stopPolling();
    tick(1000);
    httpTestingController.expectNone(apiUrl);
  }));
});