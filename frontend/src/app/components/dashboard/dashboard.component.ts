import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConvertedParameter } from '../../models/telemetry.model';
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
  private paramsSub?: Subscription;
  latestParameters: ConvertedParameter[] = [];
  settingsOpen = false;
  readonly sampleWindow = 100;
  readonly refreshRateMs = 1000;
  readonly skeletonSlots = [0, 1, 2];

  constructor(
    public telemetryService: TelemetryService,
    public themeService: ThemeService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.telemetryService.startPolling();
    this.paramsSub = this.telemetryService.parameters.subscribe((params) => {
      this.latestParameters = params;
    });
  }

  ngOnDestroy(): void {
    this.telemetryService.stopPolling();
    this.paramsSub?.unsubscribe();
  }

  onUnitChanged(): void {
    this.telemetryService.onUnitChanged();
  }

  exportCsv(): void {
    this.exportService.exportCsv(this.latestParameters);
  }

  exportExcel(): void {
    this.exportService.exportExcel(this.latestParameters);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.telemetryService.onUnitChanged();
  }

  toggleSettings(): void {
    this.settingsOpen = !this.settingsOpen;
  }

  closeSettings(): void {
    this.settingsOpen = false;
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
