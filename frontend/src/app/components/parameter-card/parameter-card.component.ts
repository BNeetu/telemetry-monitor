import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConvertedParameter, ParameterKey, StatusLevel } from '../../models/telemetry.model';
import { UnitConversionService } from '../../services/unit-conversion.service';
import { CircularGaugeComponent } from '../circular-gauge/circular-gauge.component';
import { TrendChartComponent } from '../trend-chart/trend-chart.component';

@Component({
  selector: 'app-parameter-card',
  standalone: true,
  imports: [CommonModule, FormsModule, CircularGaugeComponent, TrendChartComponent],
  templateUrl: './parameter-card.component.html',
  styleUrl: './parameter-card.component.scss',
})
export class ParameterCardComponent {
  @Input() parameter!: ConvertedParameter;
  @Input() lastUpdated: Date | null = null;
  @Output() unitChange = new EventEmitter<ParameterKey>();

  constructor(public unitService: UnitConversionService) {}

  get availableUnits(): string[] {
    return this.unitService.parameterConfigs[this.parameter.key].units;
  }

  get statusLabel(): string {
    const map: Record<StatusLevel, string> = {
      normal: 'Normal',
      warning: 'Warning',
      critical: 'Critical',
    };
    return map[this.parameter.status];
  }

  get statusColor(): string {
    const map: Record<StatusLevel, string> = {
      normal: '#34d399',
      warning: '#fbbf24',
      critical: '#f87171',
    };
    return map[this.parameter.status];
  }

  onUnitSelected(unit: string): void {
    this.unitService.setSelectedUnit(this.parameter.key, unit);
    this.unitChange.emit(this.parameter.key);
  }
}
