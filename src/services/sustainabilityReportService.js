/**
 * Downloadable Sustainability Report Service (Phase 6)
 * Smart Building Energy Waste Detection & Sustainability Monitoring System
 * 
 * Generates:
 * 1. Professional PDF Report (formatted printable document with automatic Print to PDF dialog)
 * 2. Detailed CSV Data Export (lighting intervals, occupancy sessions, waste events, daily totals)
 * 
 * Supports Daily, Weekly, Monthly, and Custom date ranges.
 * Fully transparent with explicit disclosures regarding calculated runtime estimates vs direct power metering.
 */

import { energyConfig } from '../config/energyConfig.js';
import { energyAnalyticsService } from './energyAnalyticsService.js';
import { lightingHistoryService } from './lightingHistoryService.js';
import { occupancyEventService } from './occupancyEventService.js';
import { energyWasteAnalyticsService } from './energyWasteAnalyticsService.js';

export class SustainabilityReportService {
  constructor() {
    this.projectName = 'Smart Building Energy Waste Detection & Sustainability Monitoring System';
  }

  getDateRangeForPeriod(period = 'daily', customRange = null) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    if (period === 'daily') {
      const start = new Date(y, m, d, 0, 0, 0, 0);
      const end = new Date(y, m, d, 23, 59, 59, 999);
      return { start, end, label: `Daily Report (${now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })})` };
    }

    if (period === 'weekly') {
      const start = new Date(y, m, d - 6, 0, 0, 0, 0);
      const end = new Date(y, m, d, 23, 59, 59, 999);
      return { start, end, label: `Weekly Report (${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })})` };
    }

    if (period === 'monthly') {
      const start = new Date(y, m, 1, 0, 0, 0, 0);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
      return { start, end, label: `Monthly Report (${now.toLocaleDateString([], { month: 'long', year: 'numeric' })})` };
    }

    if (period === 'custom' && customRange && customRange.startDate && customRange.endDate) {
      const start = new Date(new Date(customRange.startDate).setHours(0, 0, 0, 0));
      const end = new Date(new Date(customRange.endDate).setHours(23, 59, 59, 999));
      return { start, end, label: `Custom Range Report (${start.toLocaleDateString()} – ${end.toLocaleDateString()})` };
    }

    // Default to daily
    const start = new Date(y, m, d, 0, 0, 0, 0);
    const end = new Date(y, m, d, 23, 59, 59, 999);
    return { start, end, label: `Daily Report (${now.toLocaleDateString()})` };
  }

  /**
   * Assembles the complete data payload for reports
   * (Used by both PDF generator, CSV exporter, and automated test suite)
   */
  assembleReportData(period = 'daily', customRange = null, refNow = new Date()) {
    const { start, end, label } = this.getDateRangeForPeriod(period, customRange);
    const analytics = energyAnalyticsService.getAnalyticsForRange(start, end, refNow);
    const cfg = energyConfig.getConfig();
    const intervals = lightingHistoryService.getIntervalsForRange(start, end, refNow);
    const wasteEvents = energyWasteAnalyticsService.getEventsList().filter((ev) => {
      const t = new Date(ev.timestamp).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    const recommendations = energyAnalyticsService.getSmartEnergyRecommendations();

    return {
      metadata: {
        projectName: this.projectName,
        generationDate: refNow.toISOString(),
        generationFormatted: refNow.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        periodKey: period,
        periodLabel: label,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        mode: energyAnalyticsService.mode.toUpperCase()
      },
      configuration: {
        powerRatingWatts: cfg.powerRatingWatts,
        tariffPerKWh: cfg.tariffPerKWh,
        currencySymbol: cfg.currencySymbol,
        energyUnit: cfg.energyUnit,
        outputPin: cfg.outputPin,
        daylightThresholdAdc: cfg.daylightThresholdAdc,
        absenceTimeoutSeconds: cfg.absenceTimeoutSeconds
      },
      summary: { ...analytics.summary },
      alignment: { ...analytics.alignment },
      intervals,
      wasteEvents,
      recommendations,
      disclaimer: 'DISCLAIMER: All power, energy (kWh), and electricity cost figures are mathematical estimates derived from recorded room LED ON/OFF operating intervals and configured luminaire wattage (9 W). The physical IoT controller utilizes an Arduino Uno R3 with LDR, DHT11, and PIR sensors, and does not incorporate a physical electrical current or power meter.'
    };
  }

  // --- CSV DATA EXPORT ---
  generateCsvContent(reportData) {
    const lines = [];

    // Header & Metadata
    lines.push(`"PROJECT","${reportData.metadata.projectName}"`);
    lines.push(`"REPORT PERIOD","${reportData.metadata.periodLabel}"`);
    lines.push(`"GENERATION DATE","${reportData.metadata.generationFormatted}"`);
    lines.push(`"OPERATING MODE","${reportData.metadata.mode}"`);
    lines.push(`"CONFIGURED POWER RATING","${reportData.configuration.powerRatingWatts} W"`);
    lines.push(`"ELECTRICITY TARIFF","${reportData.configuration.currencySymbol}${reportData.configuration.tariffPerKWh} per ${reportData.configuration.energyUnit}"`);
    lines.push('');

    // Summary Section
    lines.push('"EXECUTIVE SUMMARY METRICS"');
    lines.push('"Metric","Value","Unit"');
    lines.push(`"Total Room LED Runtime","${reportData.summary.totalLedOnHours}","Hours"`);
    lines.push(`"Estimated Energy Consumed","${reportData.summary.energyConsumedKWh}","kWh"`);
    lines.push(`"Estimated Electricity Cost","${reportData.summary.electricityCostINR}","INR (${reportData.configuration.currencySymbol})"`);
    lines.push(`"Avoidable Waste Runtime","${reportData.summary.avoidableHours}","Hours"`);
    lines.push(`"Estimated Energy Wasted","${reportData.summary.avoidableEnergyKWh}","kWh"`);
    lines.push(`"Estimated Avoidable Cost","${reportData.summary.avoidableCostINR}","INR (${reportData.configuration.currencySymbol})"`);
    lines.push(`"Estimated Energy Saved (vs Baseline)","${reportData.summary.energySavedKWh}","kWh"`);
    lines.push(`"Estimated Cost Saved","${reportData.summary.costSavedINR}","INR (${reportData.configuration.currencySymbol})"`);
    lines.push(`"Energy Efficiency Percentage","${reportData.summary.efficiencyPercentage}","%"`);
    lines.push(`"Total Energy Waste Events","${reportData.summary.wasteEventsCount}","Events"`);
    lines.push('');

    // Occupancy vs Lighting Correlation
    lines.push('"OCCUPANCY VS LIGHTING CORRELATION"');
    lines.push('"Category","Hours"');
    lines.push(`"Total Window Elapsed","${reportData.alignment.totalWindowHours}"`);
    lines.push(`"Room Occupied Duration","${reportData.alignment.occupiedHours}"`);
    lines.push(`"Room Vacant Duration","${reportData.alignment.unoccupiedHours}"`);
    lines.push(`"LED ON during Occupancy (Task Lighting)","${reportData.alignment.ledOnOccupiedHours}"`);
    lines.push(`"LED ON during Vacancy (Avoidable Drain)","${reportData.alignment.ledOnVacantHours}"`);
    lines.push(`"LED ON during Sufficient Daylight (Harvesting Waste)","${reportData.alignment.ledOnDaylightHours}"`);
    lines.push('');

    // Raw Lighting Intervals
    lines.push('"RECORDED LIGHTING OPERATING INTERVALS"');
    lines.push('"Interval ID","Start Time","End Time","Duration (Sec)","State","Occupancy","Avg LDR ADC","Mode","Start Reason"');
    reportData.intervals.forEach((intv) => {
      lines.push(`"${intv.id}","${intv.clampedStartTime || intv.startTime}","${intv.clampedEndTime || intv.endTime || 'Ongoing'}","${intv.durationSeconds}","${intv.state}","${intv.occupancyAtStart || 'N/A'}","${intv.avgLdr || 'N/A'}","${intv.mode}","${(intv.startReason || '').replace(/"/g, '""')}"`);
    });
    lines.push('');

    // Energy Waste Events
    lines.push('"ENERGY WASTE EVENTS AUDIT LOG"');
    lines.push('"Event ID","Timestamp","Event Type","Severity","Avoidable Watts","Description"');
    reportData.wasteEvents.forEach((we) => {
      lines.push(`"${we.id}","${we.timestamp}","${we.eventType}","${we.severity}","${we.avoidableWatts}","${(we.description || '').replace(/"/g, '""')}"`);
    });
    lines.push('');

    // Disclaimer
    lines.push(`"DATA LIMITATIONS","${reportData.disclaimer.replace(/"/g, '""')}"`);

    return lines.join('\n');
  }

  exportCsv(period = 'daily', customRange = null) {
    const reportData = this.assembleReportData(period, customRange);
    const csvContent = this.generateCsvContent(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `eco-bms-sustainability-${period}-${new Date().toISOString().split('T')[0]}.csv`;

    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return { filename, content: csvContent };
  }

  // --- PDF REPORT HTML GENERATOR ---
  generateHtmlReport(reportData) {
    const { metadata, configuration, summary, alignment, wasteEvents, recommendations, disclaimer } = reportData;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${metadata.projectName} - ${metadata.periodLabel}</title>
  <style>
    @page { size: A4; margin: 18mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #ffffff; color: #1e293b; padding: 24px; font-size: 13px; line-height: 1.5; }
    .header { border-bottom: 3px solid #059669; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #059669; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-box { text-align: right; font-size: 11px; color: #64748b; }
    .meta-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
    .badge-hw { background: #e0f2fe; color: #0284c7; }
    .badge-demo { background: #d1fae5; color: #059669; }

    .banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 11.5px; color: #475569; }
    .banner strong { color: #0f172a; }

    .section-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 24px 0 12px; border-left: 4px solid #059669; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.04em; }

    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .card-label { font-size: 10.5px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .card-val { font-size: 20px; font-weight: 800; color: #0f172a; margin: 4px 0; font-family: monospace; }
    .card-sub { font-size: 10.5px; color: #10b981; font-weight: 600; }
    .card-sub-danger { color: #ef4444; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11.5px; }
    th { background: #f1f5f9; color: #475569; font-weight: 700; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    tr:nth-child(even) td { background: #fafafa; }

    .recs-box { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .rec-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; background: #ffffff; }
    .rec-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .rec-title { font-weight: 700; font-size: 12px; color: #0f172a; }
    .rec-priority { font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 3px; }
    .pri-CRITICAL { background: #fee2e2; color: #dc2626; }
    .pri-HIGH { background: #fef3c7; color: #d97706; }
    .pri-MEDIUM { background: #e0f2fe; color: #0284c7; }
    .pri-INFO { background: #d1fae5; color: #059669; }
    .rec-desc { font-size: 11px; color: #64748b; }

    .disclaimer { border-top: 1px solid #cbd5e1; margin-top: 32px; padding-top: 12px; font-size: 10px; color: #94a3b8; line-height: 1.4; }

    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 8px;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <h1 class="title">${metadata.projectName}</h1>
      <div class="subtitle">Official Sustainability & Energy Efficiency Report</div>
    </div>
    <div class="meta-box">
      <span class="meta-badge ${metadata.mode === 'HARDWARE' ? 'badge-hw' : 'badge-demo'}">
        ${metadata.mode} TELEMETRY
      </span>
      <div>Period: <strong>${metadata.periodLabel}</strong></div>
      <div>Generated: ${metadata.generationFormatted}</div>
    </div>
  </div>

  <div class="banner">
    <strong>Energy Parameters & Rated Configuration:</strong> 
    Room LED Power: <strong>${configuration.powerRatingWatts} W</strong> (Arduino Pin ${configuration.outputPin}) | 
    Tariff Rate: <strong>${configuration.currencySymbol}${configuration.tariffPerKWh} per ${configuration.energyUnit}</strong> | 
    Daylight Cutoff: <strong>${configuration.daylightThresholdAdc} ADC</strong> | 
    Absence Timeout: <strong>${configuration.absenceTimeoutSeconds}s</strong>
  </div>

  <div class="section-title">1. Executive Energy Consumption & Savings Summary</div>
  <div class="grid-4">
    <div class="card">
      <div class="card-label">Energy Consumed</div>
      <div class="card-val">${summary.energyConsumedKWh} <span style="font-size: 12px; font-weight: 600;">kWh</span></div>
      <div class="card-sub">${configuration.currencySymbol}${summary.electricityCostINR} electricity cost</div>
    </div>
    <div class="card">
      <div class="card-label">Active LED Runtime</div>
      <div class="card-val">${summary.totalLedOnHours} <span style="font-size: 12px; font-weight: 600;">hrs</span></div>
      <div class="card-sub">Avg ${summary.averageDailyOnHours} hrs/day</div>
    </div>
    <div class="card">
      <div class="card-label">Avoidable Waste</div>
      <div class="card-val" style="color: #dc2626;">${summary.avoidableEnergyKWh} <span style="font-size: 12px; font-weight: 600;">kWh</span></div>
      <div class="card-sub card-sub-danger">${configuration.currencySymbol}${summary.avoidableCostINR} avoidable drain</div>
    </div>
    <div class="card">
      <div class="card-label">Estimated Savings</div>
      <div class="card-val" style="color: #059669;">${summary.energySavedKWh} <span style="font-size: 12px; font-weight: 600;">kWh</span></div>
      <div class="card-sub">${configuration.currencySymbol}${summary.costSavedINR} saved vs baseline</div>
    </div>
  </div>

  <div class="section-title">2. Space Occupancy & Lighting Usage Correlation</div>
  <table>
    <thead>
      <tr>
        <th>Operational Parameter</th>
        <th>Duration (Hours)</th>
        <th>% of Window</th>
        <th>System Assessment</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Total Monitored Window</strong></td>
        <td>${alignment.totalWindowHours}h</td>
        <td>100.0%</td>
        <td>Total active monitoring period</td>
      </tr>
      <tr>
        <td><strong>Room Occupied Duration</strong></td>
        <td>${alignment.occupiedHours}h</td>
        <td>${alignment.totalWindowHours > 0 ? ((alignment.occupiedHours / alignment.totalWindowHours) * 100).toFixed(1) : 0}%</td>
        <td>Verified AI person presence detected</td>
      </tr>
      <tr>
        <td><strong>Room Vacant Duration</strong></td>
        <td>${alignment.unoccupiedHours}h</td>
        <td>${alignment.totalWindowHours > 0 ? ((alignment.unoccupiedHours / alignment.totalWindowHours) * 100).toFixed(1) : 0}%</td>
        <td>Space unoccupied (zero active human occupancy)</td>
      </tr>
      <tr>
        <td><strong>LED ON during Occupancy</strong></td>
        <td>${alignment.ledOnOccupiedHours}h</td>
        <td>${alignment.totalWindowHours > 0 ? ((alignment.ledOnOccupiedHours / alignment.totalWindowHours) * 100).toFixed(1) : 0}%</td>
        <td>Justified task illuminance satisfied</td>
      </tr>
      <tr>
        <td><strong style="color: #dc2626;">LED ON during Vacancy</strong></td>
        <td style="color: #dc2626;"><strong>${alignment.ledOnVacantHours}h</strong></td>
        <td>${alignment.totalWindowHours > 0 ? ((alignment.ledOnVacantHours / alignment.totalWindowHours) * 100).toFixed(1) : 0}%</td>
        <td style="color: #dc2626;">Avoidable vacant burn time</td>
      </tr>
      <tr>
        <td><strong style="color: #d97706;">LED ON during Sufficient Daylight</strong></td>
        <td style="color: #d97706;"><strong>${alignment.ledOnDaylightHours}h</strong></td>
        <td>${alignment.totalWindowHours > 0 ? ((alignment.ledOnDaylightHours / alignment.totalWindowHours) * 100).toFixed(1) : 0}%</td>
        <td style="color: #d97706;">Unnecessary luminaire power during natural daylight</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">3. Energy Waste Events Log (${wasteEvents.length} Recorded)</div>
  ${wasteEvents.length === 0 ? '<p style="color: #64748b; font-size: 11px;">Zero energy waste events recorded during this reporting window.</p>' : `
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Category</th>
        <th>Severity</th>
        <th>Avoidable Watts</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${wasteEvents.slice(0, 10).map((we) => `
      <tr>
        <td style="font-family: monospace;">${new Date(we.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td>${we.category}</td>
        <td><span class="rec-priority pri-${we.severity}">${we.severity}</span></td>
        <td style="font-family: monospace;">${we.avoidableWatts} W</td>
        <td>${we.description}</td>
      </tr>`).join('')}
    </tbody>
  </table>`}

  <div class="section-title">4. Evidence-Based Smart Energy Recommendations</div>
  <div class="recs-box">
    ${recommendations.map((rec) => `
    <div class="rec-item">
      <div class="rec-head">
        <span class="rec-title">${rec.title}</span>
        <span class="rec-priority pri-${rec.priority}">${rec.priority}</span>
      </div>
      <div class="rec-desc">${rec.reason} ${rec.supportingData ? `(${rec.supportingData})` : ''}</div>
      <div style="margin-top: 4px; font-size: 10.5px; color: #059669; font-weight: 600;">Recommended Action: ${rec.action}</div>
    </div>`).join('')}
  </div>

  <div class="disclaimer">
    <strong>Data Limitations & Technical Assumptions:</strong><br>
    ${disclaimer}
  </div>
</body>
</html>`;
  }

  generatePdfReport(period = 'daily', customRange = null) {
    const reportData = this.assembleReportData(period, customRange);
    const htmlContent = this.generateHtmlReport(reportData);

    if (typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        // Give time for layout rendering then trigger print dialog
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 350);
      }
    }

    return { htmlContent, reportData };
  }
}

export const sustainabilityReportService = new SustainabilityReportService();
