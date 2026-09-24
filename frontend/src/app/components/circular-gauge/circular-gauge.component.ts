import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { StatusLevel } from '../../models/telemetry.model';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: 'app-circular-gauge',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './circular-gauge.component.html',
  styleUrl: './circular-gauge.component.scss',
})
export class CircularGaugeComponent implements OnChanges {
  @Input() value = 0;
  @Input() min = 0;
  @Input() max = 100;
  @Input() unit = '';
  @Input() status: StatusLevel = 'normal';

  readonly radius = RADIUS;
  readonly circumference = CIRCUMFERENCE;
  dashOffset = CIRCUMFERENCE;

  ngOnChanges(): void {
    const range = this.max - this.min || 1;
    const percentage = Math.min(100, Math.max(0, ((this.value - this.min) / range) * 100));
    this.dashOffset = this.circumference - (this.circumference * percentage) / 100;
  }

  get statusClass(): string {
    return `status-${this.status}`;
  }
}
