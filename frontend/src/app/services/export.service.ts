import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { ConvertedParameter } from '../models/telemetry.model';

interface ExportRow {
  timestamp: string;
  velocity: number | string;
  velocityUnit: string;
  pressure: number | string;
  pressureUnit: string;
  temperature: number | string;
  temperatureUnit: string;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  // Builds one row per historical sample, using whatever units are currently
  // selected in the UI (not the raw backend units) so the export matches
  // what the user is actually looking at on screen.
  exportCsv(parameters: ConvertedParameter[] | null): void {
    if (!parameters?.length) return;

    const rows = this.buildRows(parameters);
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

  exportExcel(parameters: ConvertedParameter[] | null): void {
    if (!parameters?.length) return;

    const rows = this.buildRows(parameters);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Telemetry');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `telemetry-${this.fileStamp()}.xlsx`);
  }

  private buildRows(parameters: ConvertedParameter[]): ExportRow[] {
    const velocity = parameters.find((p) => p.key === 'velocity');
    const pressure = parameters.find((p) => p.key === 'pressure');
    const temperature = parameters.find((p) => p.key === 'temperature');

    const maxLen = Math.max(
      velocity?.history.length ?? 0,
      pressure?.history.length ?? 0,
      temperature?.history.length ?? 0,
      1
    );

    const rows: ExportRow[] = [];
    for (let i = 0; i < maxLen; i++) {
      rows.push({
        timestamp: velocity?.history[i]?.time ?? pressure?.history[i]?.time ?? '',
        velocity: velocity?.history[i]?.value ?? velocity?.value ?? '',
        velocityUnit: velocity?.unit ?? '',
        pressure: pressure?.history[i]?.value ?? pressure?.value ?? '',
        pressureUnit: pressure?.unit ?? '',
        temperature: temperature?.history[i]?.value ?? temperature?.value ?? '',
        temperatureUnit: temperature?.unit ?? '',
      });
    }

    return rows;
  }

  private fileStamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }
}
