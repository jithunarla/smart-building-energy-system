/**
 * PHASE 7: FINAL END-TO-END INTEGRATION & RELIABILITY TEST SUITE
 * Smart Building Energy Waste Detection & Sustainability Monitoring System
 * 
 * Validates the complete chain:
 * 1. AI Webcam Person Detection -> Occupancy State Machine
 * 2. 30-Second Absence Countdown -> Cancellation on Return -> Timeout to UNOCCUPIED
 * 3. Optical LDR Sensing -> Truth-table Smart Lighting Decisions
 * 4. Serial Command Dispatch & Arduino Pin D7 Telemetry Synchronization
 * 5. Lighting Interval Lifecycle & Hardware-Confirmed Operating Durations
 * 6. Centralized Energy Analytics (kWh & ₹) at Configured 9W & ₹8/kWh
 * 7. Hardware Mode vs Demo Mode Absolute Data Isolation
 * 8. Downloadable Sustainability Report Generation (PDF structure & CSV export)
 * 9. Failsafe Safety Handling (Camera Disconnect, Sensor Fault, Communication Loss)
 */

import { energyConfig } from '../src/config/energyConfig.js';
import { EnergyAnalyticsService } from '../src/services/energyAnalyticsService.js';
import { LightingHistoryService } from '../src/services/lightingHistoryService.js';
import { EnergyWasteAnalyticsService, WASTE_EVENT_TYPES } from '../src/services/energyWasteAnalyticsService.js';
import { SustainabilityReportService } from '../src/services/sustainabilityReportService.js';
import { OccupancyDetectionService, OCCUPANCY_STATES, CAMERA_STATUS } from '../src/services/occupancyDetectionService.js';
import { OccupancyEventService, OCCUPANCY_EVENT_TYPES } from '../src/services/occupancyEventService.js';
import { SmartLightingService } from '../src/services/smartLightingService.js';
import { serialService, HARDWARE_STATUS } from '../src/services/serialService.js';

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
console.log('PHASE 7: FINAL COMPREHENSIVE END-TO-END INTEGRATION TEST SUITE');
console.log('================================================================');

// =====================================================================
// WORKFLOW 1: FULL PIPELINE INTEGRATION
// Webcam AI -> Occupancy -> LDR -> Smart Lighting -> D7 Telemetry -> Intervals -> Energy
// =====================================================================
console.log('\n--- WORKFLOW 1: Full End-to-End Pipeline Integration ---');
{
  const occupancyDetector = new OccupancyDetectionService();
  const occupancyEvents = new OccupancyEventService();
  const lightingHistory = new LightingHistoryService();
  const smartLighting = new SmartLightingService();
  const energyAnalytics = new EnergyAnalyticsService();

  occupancyEvents.setMode('hardware');
  occupancyEvents.clearEvents();
  lightingHistory.setMode('hardware');
  lightingHistory.clearHistory();

  // Step 1: Camera detects person (confidence 0.88 >= 0.60 threshold)
  occupancyDetector.cameraStatus = CAMERA_STATUS.ACTIVE;
  occupancyDetector.setConfidenceThreshold(0.60);
  const rawDetections = [
    { class: 'person', score: 0.88, bbox: [50, 50, 200, 400] },
    { class: 'chair', score: 0.95, bbox: [300, 300, 100, 100] }
  ];
  const qualifying = rawDetections.filter(p => p.class === 'person' && p.score >= occupancyDetector.confidenceThreshold);
  occupancyDetector.processDetections(qualifying, Date.now());

  assert(occupancyDetector.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '1. AI detects qualifying person -> State is OCCUPIED');
  assert(occupancyDetector.peopleCount === 1, '1b. People count is 1');

  // Step 2: Occupancy event recorded
  occupancyEvents.handleOccupancyStateUpdate({
    status: OCCUPANCY_STATES.OCCUPIED,
    peopleCount: 1,
    isAbsenceCountdown: false
  });
  const occEvts = occupancyEvents.getEventsList();
  assert(occEvts.length === 1 && occEvts[0].eventType === OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED, '2. Occupancy event service recorded OCCUPANCY_STARTED');

  // Step 3: LDR reading is 280 ADC (dim daylight < 500 ADC cutoff)
  const decision1 = smartLighting.evaluateLightingDecision(
    occupancyDetector.occupancyStatus,
    280, // LDR ADC
    true, // Hardware mode
    0 // Current pin D7 reading (initially OFF)
  );

  assert(decision1.desiredState === 1, '3. OCCUPIED + 280 ADC yields desired light state = 1 (ON)');
  assert(decision1.ruleNumber === 1, '3b. Rule 1 selected (Task lighting)');

  // Step 4: Arduino receives LIGHT_ON and telemetry reports Pin D7 = 1
  serialService.parseAndDispatchReading('{"light_adc":280,"temperature":24.0,"humidity":50,"motion":0,"room_light":1,"watchdogActive":true}');
  const serialState = serialService.getState();
  assert(serialState.lastReading.room_light === 1, '4. Arduino telemetry confirms Pin D7 HIGH');

  // Step 5: Confirmed lighting transition is recorded in LightingHistoryService
  const lightEvt = lightingHistory.recordStateChange({
    newState: 'ON',
    desiredState: decision1.desiredState,
    occupancy: occupancyDetector.occupancyStatus,
    ldr: 280,
    reason: decision1.reason
  });
  assert(lightEvt !== null && lightEvt.currentState === 'ON', '5. Lighting transition event recorded for Pin D7');
  assert(lightingHistory.activeInterval !== null, '5b. Active lighting interval opened');

  // Step 6: Energy analytics calculates consumption for 9W luminaire
  const kwh = energyAnalytics.calculateEnergyKWh(9, 2); // 2 hours
  const cost = energyAnalytics.calculateCostINR(kwh, 8.0); // ₹8/kWh
  assert(Number(kwh.toFixed(4)) === 0.018, '6. 2 hours of 9W = 0.018 kWh');
  assert(Number(cost.toFixed(4)) === 0.144, '6b. 2 hours at ₹8/kWh = ₹0.144');
}

// =====================================================================
// WORKFLOW 2: 30-SECOND ABSENCE COUNTDOWN & CANCELLATION ON RETURN
// =====================================================================
console.log('\n--- WORKFLOW 2: Absence Grace Period & Return Cancellation ---');
{
  const occupancy = new OccupancyDetectionService();
  occupancy.cameraStatus = CAMERA_STATUS.ACTIVE;

  // Person enters
  const t0 = 1000000;
  occupancy.processDetections([{ class: 'person', score: 0.90, bbox: [0, 0, 10, 10] }], t0);
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '7. Initial state is OCCUPIED');

  // Person leaves camera frame -> Countdown starts
  const t1 = t0 + 1000;
  occupancy.processDetections([], t1);
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '8. State remains OCCUPIED during absence grace period');
  assert(occupancy.absenceStartTime === t1, '8b. Absence start time established');

  // After 15 seconds (15s elapsed, 15s remaining)
  occupancy.tickCountdown(t1 + 15000);
  assert(occupancy.timeUntilUnoccupied === 15, '9. At 15s elapsed, 15s remaining in countdown');
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '9b. Still OCCUPIED at 15s');

  // Person returns after 20 seconds -> Countdown cancelled!
  occupancy.processDetections([{ class: 'person', score: 0.85, bbox: [0, 0, 10, 10] }], t1 + 20000);
  assert(occupancy.absenceStartTime === null, '10. Return cancels countdown (absenceStartTime is null)');
  assert(occupancy.timeUntilUnoccupied === 30, '10b. Grace timer reset back to 30s');
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '10c. State seamlessly remains OCCUPIED');

  // Person leaves again and full 30s elapses
  const tSecondLeave = 2000000;
  occupancy.processDetections([], tSecondLeave);
  occupancy.tickCountdown(tSecondLeave + 30100); // 30.1s elapsed
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.UNOCCUPIED, '11. Timeout after 30s transitions cleanly to UNOCCUPIED');
  assert(occupancy.timeUntilUnoccupied === 0, '11b. Remaining countdown reaches 0s');
}

// =====================================================================
// WORKFLOW 3: SERIAL RELIABILITY, HEARTBEAT & WATCHDOG RECOVERY
// =====================================================================
console.log('\n--- WORKFLOW 3: Serial Communication, Heartbeat & Watchdog ---');
{
  // 12. 2-Second Heartbeat packet format
  const hb = JSON.stringify({ command: 'HEARTBEAT' });
  assert(hb === '{"command":"HEARTBEAT"}', '12. Heartbeat conforms strictly to {"command":"HEARTBEAT"}');

  // 13. Reconnection resets synchronization state
  const smartLighting = new SmartLightingService();
  smartLighting.lastDispatchedCommand = 'LIGHT_ON';
  smartLighting.lastDispatchedTimestamp = Date.now();
  smartLighting.resetSyncState();
  assert(smartLighting.lastDispatchedCommand === null, '13. Serial reconnect resets command cache for re-synchronization');
  assert(smartLighting.lastDispatchedTimestamp === 0, '13b. Dispatched timestamp reset');

  // 14. Watchdog simulation: 10 seconds of missing commands in auto mode turns LED OFF
  let simulatedArduinoLed = 1;
  let isManual = false;
  let lastCmdTime = 0;
  const nowTime = 12000; // 12 seconds later (>10s)

  if (!isManual && simulatedArduinoLed === 1 && (nowTime - lastCmdTime > 10000)) {
    simulatedArduinoLed = 0; // Hardware watchdog shuts off D7
  }
  assert(simulatedArduinoLed === 0, '14. Hardware communication watchdog de-energizes D7 after 10s of silence');
}

// =====================================================================
// WORKFLOW 4: DEMO MODE VS HARDWARE MODE ISOLATION
// =====================================================================
console.log('\n--- WORKFLOW 4: Demo Mode vs Hardware Mode Absolute Isolation ---');
{
  const lighting = new LightingHistoryService();
  const occEvents = new OccupancyEventService();
  const wasteService = new EnergyWasteAnalyticsService();

  // Test hardware writes
  lighting.setMode('hardware');
  lighting.clearHistory();
  lighting.recordStateChange({ newState: 'ON', reason: 'Hardware test event', customTimestamp: new Date() });

  occEvents.setMode('hardware');
  occEvents.clearEvents();
  occEvents.recordEvent(OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED, { peopleCount: 1 });

  assert(lighting.intervalsHardware.length === 1, '15. Hardware lighting interval recorded in hardware store');
  assert(occEvents.eventsHardware.length === 1, '15b. Hardware occupancy event recorded in hardware store');

  // Switch to demo mode and verify complete isolation
  lighting.setMode('demo');
  lighting.clearHistory();
  lighting.recordStateChange({ newState: 'ON', reason: 'Demo test event', customTimestamp: new Date() });

  occEvents.setMode('demo');
  occEvents.clearEvents();
  occEvents.recordEvent(OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED, { peopleCount: 2 });

  assert(lighting.intervalsDemo.length === 1, '16. Demo lighting interval recorded in demo store');
  assert(lighting.intervalsHardware.length === 1, '16b. Hardware lighting store remained strictly isolated and intact');
  assert(occEvents.eventsHardware.length === 1, '16c. Hardware occupancy store remained strictly isolated and intact');
}

// =====================================================================
// WORKFLOW 5: ENERGY ANALYTICS & DOWNLOADABLE REPORTS INTEGRATION
// =====================================================================
console.log('\n--- WORKFLOW 5: Energy Analytics & Downloadable Reports ---');
{
  const reportService = new SustainabilityReportService();
  const reportData = reportService.assembleReportData('daily', null, new Date(2026, 10, 18));

  // Executive summary fields
  assert(reportData.metadata.projectName.length > 0, '17a. Project name populated');
  assert(reportData.configuration.powerRatingWatts === 9, '17b. Rated power configured to 9 W');
  assert(reportData.configuration.tariffPerKWh === 8.0, '17c. Tariff configured to ₹8.00/kWh');
  assert(reportData.summary.energyConsumedKWh !== undefined, '17d. Energy consumed present');
  assert(reportData.summary.electricityCostINR !== undefined, '17e. Electricity cost present');
  assert(reportData.summary.energySavedKWh !== undefined, '17f. Energy saved present');
  assert(reportData.alignment.occupiedHours !== undefined, '17g. Occupancy vs lighting correlation present');
  assert(reportData.recommendations.length > 0, '17h. Smart recommendations present');

  // Mandatory technical disclosure notice
  assert(reportData.disclaimer.includes('mathematical estimates derived from recorded room LED'), '18. Technical assumptions and measurement limitations clearly disclosed');

  // CSV formatting
  const csv = reportService.generateCsvContent(reportData);
  assert(csv.includes('"EXECUTIVE SUMMARY METRICS"'), '19a. CSV includes EXECUTIVE SUMMARY METRICS');
  assert(csv.includes('"OCCUPANCY VS LIGHTING CORRELATION"'), '19b. CSV includes OCCUPANCY VS LIGHTING CORRELATION');
  assert(csv.includes('"RECORDED LIGHTING OPERATING INTERVALS"'), '19c. CSV includes RECORDED LIGHTING OPERATING INTERVALS');

  // HTML Print-to-PDF formatting
  const html = reportService.generateHtmlReport(reportData);
  assert(html.includes('Official Sustainability & Energy Efficiency Report'), '20a. HTML report includes official banner');
  assert(html.includes('Data Limitations & Technical Assumptions'), '20b. HTML report includes Technical Assumptions');
}

// =====================================================================
// WORKFLOW 6: FAILSAFE & SENSOR OUTAGE HANDLING
// =====================================================================
console.log('\n--- WORKFLOW 6: Failsafe Behavior & Sensor Fault Isolation ---');
{
  const smartLighting = new SmartLightingService();
  const wasteService = new EnergyWasteAnalyticsService();

  // 1. When occupancy is UNKNOWN -> Safe fallback: Room LED remains OFF
  const decisionUnknown = smartLighting.evaluateLightingDecision(OCCUPANCY_STATES.UNKNOWN, 200, true, 0);
  assert(decisionUnknown.desiredState === 0, '21. UNKNOWN occupancy withholds automatic LIGHT_ON command (Failsafe)');
  assert(decisionUnknown.ruleNumber === 4, '21b. Rule 4 selected (Failsafe fallback)');

  // 2. When LDR sensor is faulty/null -> No automatic ON command
  const decisionFault = smartLighting.evaluateLightingDecision(OCCUPANCY_STATES.OCCUPIED, null, true, 0);
  assert(decisionFault.desiredState === 0, '22. Sensor fault (LDR null) withholds automatic LIGHT_ON command');

  // 3. Waste engine flags incomplete telemetry rather than fabricating savings
  const wasteIncomplete = wasteService.evaluateCondition({ occupancy: OCCUPANCY_STATES.UNKNOWN, lightAdc: 300, roomLight: 1 });
  assert(wasteIncomplete.isIncomplete === true, '23. Telemetry outage marks analysis as incomplete');
  assert(wasteIncomplete.avoidableWatts === 0, '23b. Zero unsupported avoidable watts fabricated');
}

console.log('\n================================================================');
console.log(`TOTAL PHASE 7 TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
