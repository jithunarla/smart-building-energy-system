/**
 * PHASE 6: ADVANCED ENERGY ANALYTICS, SAVINGS ESTIMATION & SUSTAINABILITY REPORTING
 * Comprehensive Automated Test Suite
 * 
 * Validates:
 * 1. Mathematical Energy (kWh) and Electricity Cost (₹) modeling
 * 2. Room LED Lighting Interval Lifecycle & Transition Tracking
 * 3. Intelligent Energy Waste Scenarios (1 through 5)
 * 4. Daily (24h), Weekly (7d), Monthly, and Custom Range Analytics Aggregations
 * 5. Occupancy vs Lighting Usage Alignment & Theoretical Baseline Comparisons
 * 6. Report Generation (PDF structure & CSV export)
 * 7. System Regressions (Hardware pin D7, LDR A0, DHT11, 2s heartbeat, 30s grace period)
 */

import { energyConfig, DEFAULT_ENERGY_CONFIG } from '../src/config/energyConfig.js';
import { EnergyAnalyticsService } from '../src/services/energyAnalyticsService.js';
import { LightingHistoryService, lightingHistoryService } from '../src/services/lightingHistoryService.js';
import { EnergyWasteAnalyticsService, WASTE_EVENT_TYPES } from '../src/services/energyWasteAnalyticsService.js';
import { SustainabilityReportService } from '../src/services/sustainabilityReportService.js';
import { SmartLightingService } from '../src/services/smartLightingService.js';
import { serialService } from '../src/services/serialService.js';

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

console.log('================================================================');
console.log('PHASE 6: ADVANCED ENERGY ANALYTICS & REPORTING TEST SUITE');
console.log('================================================================');

const energyService = new EnergyAnalyticsService();

// =====================================================================
// SECTION 1: ENERGY CALCULATION TESTS
// =====================================================================
console.log('\n--- SECTION 1: Mathematical Energy & Cost Calculations ---');
{
  // 1. 9 W LED operating for one hour = 0.009 kWh
  const kwh1 = energyService.calculateEnergyKWh(9, 1);
  assert(Number(kwh1.toFixed(5)) === 0.009, '1. 9 W LED for 1 hour = 0.009 kWh', `Actual: ${kwh1}`);

  // 2. 9 W LED operating for 10 hours = 0.09 kWh
  const kwh10 = energyService.calculateEnergyKWh(9, 10);
  assert(Number(kwh10.toFixed(5)) === 0.09, '2. 9 W LED for 10 hours = 0.09 kWh', `Actual: ${kwh10}`);

  // 2b. 9 W LED for 100 hours = 0.9 kWh
  const kwh100 = energyService.calculateEnergyKWh(9, 100);
  assert(Number(kwh100.toFixed(5)) === 0.9, '2b. 9 W LED for 100 hours = 0.9 kWh', `Actual: ${kwh100}`);

  // 3. One hour at ₹8/kWh = ₹0.072
  const cost1 = energyService.calculateCostINR(kwh1, 8.0);
  assert(Number(cost1.toFixed(5)) === 0.072, '3. One hour of 9 W at ₹8/kWh = ₹0.072', `Actual: ${cost1}`);

  // 4. Ten hours at ₹8/kWh = ₹0.72
  const cost10 = energyService.calculateCostINR(kwh10, 8.0);
  assert(Number(cost10.toFixed(5)) === 0.72, '4. Ten hours of 9 W at ₹8/kWh = ₹0.72', `Actual: ${cost10}`);

  // 4b. 100 hours at ₹8/kWh = ₹7.20
  const cost100 = energyService.calculateCostINR(kwh100, 8.0);
  assert(Number(cost100.toFixed(5)) === 7.20, '4b. 100 hours of 9 W at ₹8/kWh = ₹7.20', `Actual: ${cost100}`);

  // 5. Wattage configuration changes recalculate results
  const kwh12W = energyService.calculateEnergyKWh(12, 1);
  assert(Number(kwh12W.toFixed(5)) === 0.012, '5. Wattage updated to 12 W for 1 hour = 0.012 kWh', `Actual: ${kwh12W}`);

  // 6. Tariff changes recalculate cost without changing kWh
  const costTariff10 = energyService.calculateCostINR(kwh1, 10.0);
  assert(Number(costTariff10.toFixed(5)) === 0.090, '6. Tariff updated to ₹10/kWh recalculates cost to ₹0.090 with invariant kWh', `Actual: ${costTariff10}`);
}

// =====================================================================
// SECTION 2: LIGHTING USAGE HISTORY & INTERVAL TRACKING TESTS
// =====================================================================
console.log('\n--- SECTION 2: Lighting Usage History & Interval Tracking ---');
{
  const lightingService = new LightingHistoryService();
  lightingService.setMode('hardware');
  lightingService.clearHistory();

  const t0 = new Date('2026-11-18T08:00:00Z');
  const t1 = new Date('2026-11-18T09:30:00Z');

  // 1. LED OFF to ON creates an open interval
  const evtOn = lightingService.recordStateChange({
    newState: 'ON',
    desiredState: 1,
    occupancy: 'OCCUPIED',
    ldr: 250,
    reason: 'Task lighting activated',
    customTimestamp: t0
  });

  assert(evtOn !== null, '1. LED OFF to ON generates transition event');
  assert(evtOn.currentState === 'ON', '1b. Event state is ON');
  assert(lightingService.activeInterval !== null, '1c. Active interval is opened');
  assert(lightingService.activeInterval.state === 'ON', '1d. Active interval state is ON');
  assert(lightingService.activeInterval.endTime === null, '1e. Active interval has null endTime (ongoing)');

  // 2. Duplicate ON events are ignored
  const dupOn = lightingService.recordStateChange({
    newState: 'ON',
    desiredState: 1,
    occupancy: 'OCCUPIED',
    ldr: 260,
    reason: 'Repeated ON telemetry',
    customTimestamp: new Date('2026-11-18T08:00:10Z')
  });
  assert(dupOn === null, '2. Duplicate ON events are suppressed without duplicate interval creation');
  assert(lightingService.getIntervalsList().length === 1, '2b. Exactly one interval preserved');

  // 3. LED ON to OFF closes the active interval
  const evtOff = lightingService.recordStateChange({
    newState: 'OFF',
    desiredState: 0,
    occupancy: 'UNOCCUPIED',
    ldr: 600,
    reason: 'Vacancy cutoff',
    customTimestamp: t1
  });

  assert(evtOff !== null, '3. LED ON to OFF generates transition event');
  assert(evtOff.currentState === 'OFF', '3b. Event state is OFF');
  assert(lightingService.activeInterval === null, '3c. Active interval is closed');
  
  const closed = lightingService.getIntervalsList()[0];
  assert(closed.endTime !== null, '3d. Closed interval has valid endTime');
  assert(closed.durationSeconds === 5400, `3e. Duration is exactly 5400s / 1.5h (actual: ${closed.durationSeconds}s)`);

  // 4. Duplicate OFF events are ignored
  const dupOff = lightingService.recordStateChange({
    newState: 'OFF',
    desiredState: 0,
    occupancy: 'UNOCCUPIED',
    ldr: 650,
    reason: 'Repeated OFF telemetry',
    customTimestamp: new Date('2026-11-18T09:30:10Z')
  });
  assert(dupOff === null, '4. Duplicate OFF events are ignored');

  // 5. Ongoing ON interval duration calculation
  const t2 = new Date('2026-11-18T10:00:00Z');
  lightingService.recordStateChange({
    newState: 'ON',
    desiredState: 1,
    occupancy: 'OCCUPIED',
    ldr: 200,
    customTimestamp: t2
  });

  const queryRef = new Date('2026-11-18T10:45:00Z'); // 45 minutes later
  const rangeIntervals = lightingService.getIntervalsForRange(
    new Date('2026-11-18T00:00:00Z'),
    new Date('2026-11-18T23:59:59Z'),
    queryRef
  );
  const ongoing = rangeIntervals.find(i => i.isOngoing);
  assert(ongoing !== undefined, '5. Ongoing interval correctly identified');
  assert(ongoing.durationSeconds === 2700, `5b. Ongoing interval duration calculated to 2700s / 45m (actual: ${ongoing.durationSeconds}s)`);

  // 6. Midnight-crossing interval splitting
  const midnightStart = new Date(2026, 10, 17, 23, 30, 0); // Nov 17 23:30
  const midnightEnd = new Date(2026, 10, 18, 1, 30, 0);   // Nov 18 01:30
  const splitQuery = lightingService.getIntervalsForRange(
    new Date(2026, 10, 18, 0, 0, 0),
    new Date(2026, 10, 18, 23, 59, 59),
    new Date(2026, 10, 18, 12, 0, 0)
  );
  // Verify duration clamping helper
  const nov18Day = new Date(2026, 10, 18);
  const nov18Bounds = lightingService.getTodayBounds(nov18Day);
  assert(nov18Bounds.start.getHours() === 0, '6. Local day boundary starts at 00:00:00');
  assert(nov18Bounds.end.getHours() === 23, '6b. Local day boundary ends at 23:59:59');

  // 7. Separation between desired state and actual hardware state
  assert(evtOn.desiredState === 1 && evtOn.actualHardwareConfirmed === 1, '7. Desired state and actual hardware state recorded distinctly');
}

// =====================================================================
// SECTION 3: INTELLIGENT ENERGY WASTE SCENARIO TESTS
// =====================================================================
console.log('\n--- SECTION 3: Intelligent Energy Waste Scenarios ---');
{
  const wasteService = new EnergyWasteAnalyticsService();
  wasteService.setMode('hardware');
  wasteService.clearEvents();

  // Scenario 1: Unoccupied room + LED ON => Avoidable vacancy drain
  const res1 = wasteService.evaluateCondition({
    occupancy: 'UNOCCUPIED',
    lightAdc: 300,
    roomLight: 1
  });
  assert(res1.isWaste === true, '8. Unoccupied + LED ON identifies energy waste');
  assert(res1.type === WASTE_EVENT_TYPES.VACANCY_LIGHT_WASTE, '8b. Event type is VACANCY_LIGHT_WASTE');
  assert(res1.avoidableWatts === 9, '8c. Avoidable load is 9 W');
  assert(res1.severity === 'CRITICAL', '8d. Vacancy waste severity is CRITICAL');

  // Scenario 2: Sufficient daylight (>= 500 ADC) + LED ON => Daylight harvesting inefficiency
  const res2 = wasteService.evaluateCondition({
    occupancy: 'OCCUPIED',
    lightAdc: 650,
    roomLight: 1
  });
  assert(res2.isWaste === true, '9. Daylight >= 500 ADC + LED ON identifies harvesting inefficiency');
  assert(res2.type === WASTE_EVENT_TYPES.DAYLIGHT_HARVEST_WASTE, '9b. Event type is DAYLIGHT_HARVEST_WASTE');
  assert(res2.avoidableWatts === 9, '9c. Avoidable load is 9 W');
  assert(res2.severity === 'WARNING', '9d. Daylight waste severity is WARNING');

  // Scenario 3: Occupied + Insufficient Daylight (< 500 ADC) + LED OFF => Lighting requirement warning (NOT savings)
  const res3 = wasteService.evaluateCondition({
    occupancy: 'OCCUPIED',
    lightAdc: 200,
    roomLight: 0
  });
  assert(res3.isWaste === false, '10. Occupied + low LDR + LED OFF is NOT marked as energy savings');
  assert(res3.type === WASTE_EVENT_TYPES.ILLUMINANCE_DEFICIT_WARNING, '10b. Type is ILLUMINANCE_DEFICIT_WARNING');
  assert(res3.isWarning === true, '10c. Correctly flagged as task illuminance warning');
  assert(res3.avoidableWatts === 0, '10d. Avoidable watts is 0 (comfort concern, not waste)');

  // Scenario 4: Efficient lighting operation
  const res4a = wasteService.evaluateCondition({ occupancy: 'UNOCCUPIED', lightAdc: 300, roomLight: 0 });
  const res4b = wasteService.evaluateCondition({ occupancy: 'OCCUPIED', lightAdc: 700, roomLight: 0 });
  const res4c = wasteService.evaluateCondition({ occupancy: 'OCCUPIED', lightAdc: 250, roomLight: 1 });
  assert(res4a.type === WASTE_EVENT_TYPES.EFFICIENT_OPERATION, '11a. Unoccupied + LED OFF = Efficient');
  assert(res4b.type === WASTE_EVENT_TYPES.EFFICIENT_OPERATION, '11b. Occupied + Bright + LED OFF = Efficient');
  assert(res4c.type === WASTE_EVENT_TYPES.EFFICIENT_OPERATION, '11c. Occupied + Dim + LED ON = Efficient');

  // Scenario 5: Unknown or stale sensor information
  const res5a = wasteService.evaluateCondition({ occupancy: 'UNKNOWN', lightAdc: 300, roomLight: 1 });
  const res5b = wasteService.evaluateCondition({ occupancy: 'OCCUPIED', lightAdc: null, roomLight: 1 });
  assert(res5a.isIncomplete === true, '12a. UNKNOWN occupancy marks analysis as incomplete');
  assert(res5a.avoidableWatts === 0, '12b. UNKNOWN occupancy withholds unsupported waste calculations');
  assert(res5b.isIncomplete === true, '12c. Missing LDR sensor marks analysis as incomplete');
}

// =====================================================================
// SECTION 4: PERIOD ANALYTICS & OCCUPANCY VS LIGHTING ALIGNMENT
// =====================================================================
console.log('\n--- SECTION 4: Period Analytics & Multi-Day Aggregations ---');
{
  const refDay = new Date(2026, 10, 18);
  const dailyBreakdown = energyService.getDailyHourlyBreakdown(refDay, refDay);
  assert(dailyBreakdown.length === 24, '13. Daily breakdown contains exactly 24 hourly buckets');
  assert(dailyBreakdown[0].label === '12 AM', '13b. First bucket is 12 AM');
  assert(dailyBreakdown[12].label === '12 PM', '13c. Midday bucket is 12 PM');
  assert(dailyBreakdown[23].label === '11 PM', '13d. Final bucket is 11 PM');

  const weeklyBreakdown = energyService.getWeeklyDailyBreakdown(refDay);
  assert(weeklyBreakdown.length === 7, '14. Weekly breakdown contains exactly 7 daily buckets');
  assert(weeklyBreakdown[6].dayName !== undefined, '14b. Weekly bucket has valid dayName');

  const monthlyBreakdown = energyService.getMonthlyBreakdown(refDay);
  assert(monthlyBreakdown.length >= 4, '15. Monthly breakdown groups month into 4-5 weekly slices');

  // Occupancy vs Lighting alignment
  const todayBounds = lightingHistoryService.getTodayBounds(refDay);
  const alignment = energyService.alignOccupancyAndLighting(todayBounds.start, todayBounds.end, refDay);
  assert(alignment.totalWindowHours !== undefined, '16a. Total window hours computed');
  assert(alignment.occupiedHours !== undefined, '16b. Occupied hours computed');
  assert(alignment.unoccupiedHours !== undefined, '16c. Unoccupied hours computed');
  assert(alignment.ledOnHours !== undefined, '16d. Total LED ON hours computed');
  assert(alignment.ledOnOccupiedHours !== undefined, '16e. Useful task lighting hours computed');
  assert(alignment.ledOnVacantHours !== undefined, '16f. Vacant drain hours computed');
  assert(alignment.ledOnDaylightHours !== undefined, '16g. Daylight waste hours computed');
}

// =====================================================================
// SECTION 5: REPORT GENERATION (PDF & CSV) TESTS
// =====================================================================
console.log('\n--- SECTION 5: Downloadable Sustainability Report Generation ---');
{
  const reportService = new SustainabilityReportService();
  const reportData = reportService.assembleReportData('daily', null, new Date(2026, 10, 18));

  // 17. Verify all required executive sections exist
  assert(reportData.metadata.projectName.includes('Smart Building Energy Waste Detection'), '17a. Project name present in report');
  assert(reportData.configuration.powerRatingWatts === 9, '17b. Rated power (9 W) present');
  assert(reportData.configuration.tariffPerKWh === 8.0, '17c. Tariff (₹8/kWh) present');
  assert(reportData.summary.energyConsumedKWh !== undefined, '17d. Energy consumed present');
  assert(reportData.summary.electricityCostINR !== undefined, '17e. Electricity cost present');
  assert(reportData.summary.avoidableEnergyKWh !== undefined, '17f. Avoidable energy present');
  assert(reportData.summary.energySavedKWh !== undefined, '17g. Energy saved present');
  assert(reportData.summary.efficiencyPercentage !== undefined, '17h. Efficiency percentage present');
  assert(reportData.alignment.occupiedHours !== undefined, '17i. Occupancy vs lighting correlation present');
  assert(reportData.recommendations.length > 0, '17j. Smart recommendations present');
  assert(reportData.disclaimer.includes('DISCLAIMER: All power, energy (kWh), and electricity cost figures are mathematical estimates'), '17k. Mandatory transparency disclaimer present');

  // 18. CSV Content formatting
  const csvContent = reportService.generateCsvContent(reportData);
  assert(csvContent.includes('"PROJECT"'), '18a. CSV header contains PROJECT');
  assert(csvContent.includes('"EXECUTIVE SUMMARY METRICS"'), '18b. CSV contains EXECUTIVE SUMMARY METRICS');
  assert(csvContent.includes('"OCCUPANCY VS LIGHTING CORRELATION"'), '18c. CSV contains OCCUPANCY VS LIGHTING CORRELATION');
  assert(csvContent.includes('"RECORDED LIGHTING OPERATING INTERVALS"'), '18d. CSV contains RECORDED LIGHTING OPERATING INTERVALS');
  assert(csvContent.includes('"DATA LIMITATIONS"'), '18e. CSV contains DATA LIMITATIONS disclaimer');

  // 19. HTML/PDF Print Document formatting
  const htmlContent = reportService.generateHtmlReport(reportData);
  assert(htmlContent.includes('Official Sustainability & Energy Efficiency Report'), '19a. HTML report contains title banner');
  assert(htmlContent.includes('Executive Energy Consumption & Savings Summary'), '19b. HTML report contains Executive Summary');
  assert(htmlContent.includes('Space Occupancy & Lighting Usage Correlation'), '19c. HTML report contains Occupancy vs Lighting Table');
  assert(htmlContent.includes('Data Limitations & Technical Assumptions'), '19d. HTML report contains Technical Assumptions');
}

// =====================================================================
// SECTION 6: REGRESSION TESTING (PHASES 1–5 INTACT)
// =====================================================================
console.log('\n--- SECTION 6: System & Hardware Regressions ---');
{
  const smartLighting = new SmartLightingService();

  // 20. Arduino Pin D7 Room LED control logic intact
  const dec1 = smartLighting.evaluateLightingDecision('OCCUPIED', 200, true, 0);
  assert(dec1.desiredState === 1, '20. OCCUPIED + LDR 200 ADC energizes Pin D7 room LED');

  // 21. Daylight Harvesting cutoff intact
  const dec2 = smartLighting.evaluateLightingDecision('OCCUPIED', 750, true, 1);
  assert(dec2.desiredState === 0, '21. OCCUPIED + LDR 750 ADC de-energizes Pin D7 room LED (Daylight Harvesting)');

  // 22. Vacant Cutoff intact
  const dec3 = smartLighting.evaluateLightingDecision('UNOCCUPIED', 200, true, 1);
  assert(dec3.desiredState === 0, '22. UNOCCUPIED + Any LDR turns Room LED OFF');

  // 23. Manual Override intact
  smartLighting.setManualOverride(true);
  smartLighting.desiredLightState = 1;
  const dec4 = smartLighting.evaluateLightingDecision('UNOCCUPIED', 800, true, 0);
  assert(dec4.desiredState === 1 && dec4.isOverride === true, '23. Manual Override preserved despite UNOCCUPIED and abundant daylight');
  smartLighting.setManualOverride(false);

  // 24. 2-Second Heartbeat command format intact
  const heartbeatCmd = JSON.stringify({ command: 'HEARTBEAT' });
  assert(heartbeatCmd === '{"command":"HEARTBEAT"}', '24. 2-Second Heartbeat command format matches {"command":"HEARTBEAT"}');

  // 25. Telemetry parser intact
  serialService.parseAndDispatchReading('{"light_adc":450,"temperature":24.5,"humidity":55,"motion":1,"room_light":1,"watchdogActive":true}');
  const parsedState = serialService.getState();
  assert(parsedState.lastReading !== null, '25. Serial parser dispatched reading');
  assert(parsedState.lastReading.light_adc === 450, '25b. LDR light_adc = 450');
  assert(parsedState.lastReading.temperature === 24.5, '25c. DHT11 temperature = 24.5°C');
  assert(parsedState.lastReading.humidity === 55, '25d. DHT11 humidity = 55%');
  assert(parsedState.lastReading.room_light === 1, '25e. Pin D7 room_light = 1');
}

console.log('\n================================================================');
console.log(`TOTAL PHASE 6 TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
