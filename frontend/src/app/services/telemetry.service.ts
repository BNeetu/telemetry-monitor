import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  interval,
  of,
  startWith,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import {
  ConnectionStatus,
  ConvertedParameter,
  DashboardResponse,
  ParameterKey,
  StatusLevel,
} from '../models/telemetry.model';
import { environment } from '../../environments/environment';
import { UnitConversionService } from './unit-conversion.service';

@Injectable({ providedIn: 'root' })
export class TelemetryService implements OnDestroy {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/dashboard`;
  private pollSub?: Subscription;
  private latestRaw?: DashboardResponse;

  readonly connectionStatus = new BehaviorSubject<ConnectionStatus>('connecting');
  readonly loading = new BehaviorSubject<boolean>(true);
  readonly errorMessage = new BehaviorSubject<string | null>(null);
  readonly lastUpdated = new BehaviorSubject<Date | null>(null);
  readonly parameters = new BehaviorSubject<ConvertedParameter[]>([]);
  readonly rawData = new BehaviorSubject<DashboardResponse | null>(null);

  constructor(
    private http: HttpClient,
    private unitService: UnitConversionService
  ) {}

  startPolling(): void {
    if (this.pollSub) return;

    this.pollSub = interval(1000)
      .pipe(
        startWith(0),
        tap(() => {
          if (this.connectionStatus.value === 'disconnected') {
            this.connectionStatus.next('connecting');
          }
        }),
        switchMap(() =>
          this.http.get<DashboardResponse>(this.apiUrl).pipe(
            catchError((err) => {
              this.connectionStatus.next('error');
              this.errorMessage.next(err.message ?? 'Failed to fetch telemetry data');
              this.loading.next(false);
              return of(null);
            })
          )
        )
      )
      .subscribe((data) => {
        if (!data) return;
        this.latestRaw = data;
        this.rawData.next(data);
        this.connectionStatus.next('connected');
        this.errorMessage.next(null);
        this.loading.next(false);
        this.lastUpdated.next(new Date(data.timestamp));
        this.refreshConvertedParameters();
      });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
    this.connectionStatus.next('disconnected');
  }

  refreshConvertedParameters(): void {
    if (!this.latestRaw) return;

    const keys: ParameterKey[] = ['velocity', 'pressure', 'temperature'];
    const converted = keys.map((key) => this.convertParameter(key, this.latestRaw!));
    this.parameters.next(converted);
  }

  onUnitChanged(): void {
    this.refreshConvertedParameters();
  }

  private convertParameter(key: ParameterKey, data: DashboardResponse): ConvertedParameter {
    const config = this.unitService.parameterConfigs[key];
    const sensor = data[key];
    const unit = this.unitService.getSelectedUnit(key);
    const value = this.unitService.convertValue(sensor.value, key, unit);
    const history = sensor.history.map((point) => ({
      time: point.time,
      value: Number(this.unitService.convertValue(point.value, key, unit).toFixed(2)),
    }));

    const status = this.getStatus(value, key, unit);

    return {
      key,
      label: config.label,
      value: Number(value.toFixed(2)),
      unit,
      status,
      history,
      min: Number(this.unitService.convertThreshold(config.min, key, unit).toFixed(2)),
      max: Number(this.unitService.convertThreshold(config.max, key, unit).toFixed(2)),
    };
  }

  private getStatus(value: number, key: ParameterKey, unit: string): StatusLevel {
    const config = this.unitService.parameterConfigs[key];
    const warningLow = this.unitService.convertThreshold(config.warningLow, key, unit);
    const warningHigh = this.unitService.convertThreshold(config.warningHigh, key, unit);
    const criticalLow = this.unitService.convertThreshold(config.criticalLow, key, unit);
    const criticalHigh = this.unitService.convertThreshold(config.criticalHigh, key, unit);

    if (value <= criticalLow || value >= criticalHigh) return 'critical';
    if (value <= warningLow || value >= warningHigh) return 'warning';
    return 'normal';
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
