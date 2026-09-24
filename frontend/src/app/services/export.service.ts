import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { DashboardResponse } from '../models/telemetry.model';

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportCsv(data: DashboardResponse | null): void {
    if (!data) return;

    const rows = this.buildRows(data);
    const header = 'Timestamp,Velocity,Velocity Unit,Pressure,Pressure Unit,Temperature,Temperature Unit';
    const body = rows
      .map(
        (row) =>
          `${row.timestamp},${row.velocity},${row.velocityUnit},${row.pressure},${row.pressureUnit},${row.temperature},${row.temperatureUnit}`
      )
      .join('\n');

    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `telemetry-${this.fileStamp()}.csv`);
  }

  exportExcel(data: DashboardResponse | null): void {
    if (!data) return;

    const rows = this.buildRows(data);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Telemetry');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `telemetry-${this.fileStamp()}.xlsx`);
  }

  private buildRows(data: DashboardResponse) {
    const maxLen = Math.max(
      data.velocity.history.length,
      data.pressure.history.length,
      data.temperature.history.length
    );

    const rows = [];
    for (let i = 0; i < maxLen; i++) {
      rows.push({
        timestamp: data.timestamp,
        velocity: data.velocity.history[i]?.value ?? data.velocity.value,
        velocityUnit: data.velocity.unit,
        pressure: data.pressure.history[i]?.value ?? data.pressure.value,
        pressureUnit: data.pressure.unit,
        temperature: data.temperature.history[i]?.value ?? data.temperature.value,
        temperatureUnit: data.temperature.unit,
        time: data.velocity.history[i]?.time ?? '',
      });
    }

    if (rows.length === 0) {
      rows.push({
        timestamp: data.timestamp,
        velocity: data.velocity.value,
        velocityUnit: data.velocity.unit,
        pressure: data.pressure.value,
        pressureUnit: data.pressure.unit,
        temperature: data.temperature.value,
        temperatureUnit: data.temperature.unit,
        time: '',
      });
    }

    return rows;
  }

  private fileStamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }
}
