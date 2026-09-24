import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardResponse } from '../../models/telemetry.model';
import { ExportService } from '../../services/export.service';
import { TelemetryService } from '../../services/telemetry.service';
import { ThemeService } from '../../services/theme.service';
import { ParameterCardComponent } from '../parameter-card/parameter-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AsyncPipe, DatePipe, ParameterCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private rawSub?: Subscription;
  latestRaw: DashboardResponse | null = null;
  settingsOpen = false;
  readonly sampleWindow = 100;
  readonly refreshRateMs = 1000;

  constructor(
    public telemetryService: TelemetryService,
    public themeService: ThemeService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.telemetryService.startPolling();
    this.rawSub = this.telemetryService.rawData.subscribe((data) => {
      this.latestRaw = data;
    });
  }

  ngOnDestroy(): void {
    this.telemetryService.stopPolling();
    this.rawSub?.unsubscribe();
  }

  onUnitChanged(): void {
    this.telemetryService.onUnitChanged();
  }

  exportCsv(): void {
    this.exportService.exportCsv(this.latestRaw);
  }

  exportExcel(): void {
    this.exportService.exportExcel(this.latestRaw);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.telemetryService.onUnitChanged();
  }

  toggleSettings(): void {
    this.settingsOpen = !this.settingsOpen;
  }

  get connectionLabel(): string {
    const status = this.telemetryService.connectionStatus.value;
    const map: Record<string, string> = {
      connected: 'Connected',
      connecting: 'Connecting...',
      disconnected: 'Disconnected',
      error: 'Connection Error',
    };
    return map[status] ?? status;
  }
}
