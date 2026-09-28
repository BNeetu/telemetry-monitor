import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  CategoryScale,
  Chart,
  ChartConfiguration,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { HistoryPoint } from '../../models/telemetry.model';
import { ThemeService } from '../../services/theme.service';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  template: `
    <div class="chart-wrapper">
      <button type="button" class="reset-zoom" (click)="resetZoom()" title="Reset zoom">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12a9 9 0 1 1 3 6.7M3 12v5h5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [
    `
      .chart-wrapper {
        position: relative;
        height: 220px;
        width: 100%;
      }

      .reset-zoom {
        position: absolute;
        top: 4px;
        right: 4px;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: 1px solid var(--border);
        background: var(--bg-surface-alt);
        color: var(--text-tertiary);
        cursor: pointer;
        transition: color 0.15s ease, border-color 0.15s ease;
      }

      .reset-zoom:hover {
        color: var(--accent);
        border-color: var(--accent);
      }
    `,
  ],
})
export class TrendChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() history: HistoryPoint[] = [];
  @Input() unit = '';
  @Input() label = '';
  @Input() statusColor = '#34d399';

  private chart?: Chart<'line'>;

  constructor(private themeService: ThemeService) {
    effect(() => {
      this.themeService.theme();
      if (this.chart) {
        this.updateChart();
      }
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['history'] || changes['unit'] || changes['statusColor'])) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  resetZoom(): void {
    this.chart?.resetZoom();
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: this.label,
            data: [],
            borderColor: this.statusColor,
            backgroundColor: `${this.statusColor}33`,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `Time: ${items[0]?.label ?? ''}`,
              label: (item) => `${item.parsed.y} ${this.unit}`,
            },
          },
          zoom: {
            pan: { enabled: true, mode: 'x' },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'x',
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: this.axisColor(),
              maxTicksLimit: 8,
              font: this.tickFont,
            },
            grid: { color: this.gridColor() },
          },
          y: {
            title: {
              display: true,
              text: this.unit,
              color: this.axisColor(),
              font: this.tickFont,
            },
            ticks: { color: this.axisColor(), font: this.tickFont },
            grid: { color: this.gridColor() },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chart) return;

    this.chart.data.labels = this.history.map((h) => h.time);
    this.chart.data.datasets[0].data = this.history.map((h) => h.value);
    this.chart.data.datasets[0].borderColor = this.statusColor;
    this.chart.data.datasets[0].backgroundColor = `${this.statusColor}33`;

    const yScale = this.chart.options.scales?.['y'];
    if (yScale?.title) {
      yScale.title.text = this.unit;
      yScale.title.color = this.axisColor();
    }

    const xScale = this.chart.options.scales?.['x'];
    if (xScale?.ticks) xScale.ticks.color = this.axisColor();
    if (xScale?.grid) xScale.grid.color = this.gridColor();
    if (yScale?.ticks) yScale.ticks.color = this.axisColor();
    if (yScale?.grid) yScale.grid.color = this.gridColor();

    this.chart.update('none');
  }

  private axisColor(): string {
    return this.themeService.theme() === 'dark' ? '#94a3b8' : '#52607a';
  }

  private gridColor(): string {
    return this.themeService.theme() === 'dark' ? '#22304a' : '#e2e8f0';
  }

  private readonly tickFont = { family: 'Inter', size: 10 };
}
