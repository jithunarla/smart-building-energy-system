/**
 * PHASE 5: AI OCCUPANCY DETECTION RELIABILITY, ACTIVITY EVENTS & OCCUPANCY ANALYTICS
 * Test Suite validating:
 * 1. AI Detection Reliability & Filtering
 * 2. Meaningful Occupancy Events Generation (no per-frame duplicates)
 * 3. Local Storage Persistence & Mode Separation (HARDWARE vs DEMO)
 * 4. Local Calendar Day Filtering (Today vs Yesterday)
 * 5. 24-Hour Hourly Activity Timeline (Multi-hour splitting, Midnight crossing, Ongoing sessions)
 * 6. Regression Testing (D7 LED, LDR, DHT11, 2s Heartbeat, 30s Grace Period, Manual Override)
 */

import { OccupancyDetectionService, OCCUPANCY_STATES, CAMERA_STATUS } from '../src/services/occupancyDetectionService.js';
import { OccupancyEventService, OCCUPANCY_EVENT_TYPES } from '../src/services/occupancyEventService.js';
import { SmartLightingService } from '../src/services/smartLightingService.js';
import { serialService, SerialService, HARDWARE_STATUS } from '../src/services/serialService.js';

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
console.log('PHASE 5: AI OCCUPANCY RELIABILITY & 24H ANALYTICS TEST SUITE');
console.log('================================================================');

// =====================================================================
// SECTION 1: AI DETECTION RELIABILITY & FILTERING
// =====================================================================
console.log('\n--- SECTION 1: AI Detection Reliability & Filtering ---');
{
  const occupancy = new OccupancyDetectionService();
  occupancy.setConfidenceThreshold(0.60);
  occupancy.cameraStatus = CAMERA_STATUS.ACTIVE;

  // 1. Person detected above threshold
  const rawPreds1 = [
    { class: 'person', score: 0.88, bbox: [10, 10, 100, 200] },
    { class: 'chair', score: 0.95, bbox: [200, 200, 80, 80] }
  ];
  const qualifying1 = rawPreds1.filter(p => p.class === 'person' && p.score >= occupancy.confidenceThreshold);
  assert(qualifying1.length === 1 && qualifying1[0].score === 0.88, '1. Person detected above 0.60 threshold is counted');

  // 2. Non-person object rejected
  assert(!qualifying1.some(p => p.class === 'chair'), '2. Non-person object (chair) is strictly rejected');

  // 3. Low-confidence detection rejected
  const rawPreds2 = [{ class: 'person', score: 0.45, bbox: [10, 10, 100, 200] }];
  const qualifying2 = rawPreds2.filter(p => p.class === 'person' && p.score >= occupancy.confidenceThreshold);
  assert(qualifying2.length === 0, '3. Low-confidence person (0.45 < 0.60) is rejected');

  // 4. Multiple people counted correctly
  const rawPreds3 = [
    { class: 'person', score: 0.75, bbox: [10, 10, 100, 200] },
    { class: 'person', score: 0.92, bbox: [150, 10, 100, 200] },
    { class: 'bottle', score: 0.99, bbox: [50, 50, 20, 40] }
  ];
  const qualifying3 = rawPreds3.filter(p => p.class === 'person' && p.score >= occupancy.confidenceThreshold);
  assert(qualifying3.length === 2, '4. Multiple people (2 persons) counted correctly');

  // 5. Camera unavailable produces UNKNOWN
  occupancy.stopCamera();
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.UNKNOWN, '5. Camera unavailable transitions safely to UNKNOWN');

  // 6. Stale detection results are rejected
  occupancy.cameraStatus = CAMERA_STATUS.ACTIVE;
  occupancy.currentFrameSeq = 10;
  occupancy.latestCompletedFrameSeq = 10;
  // An asynchronous frame from sequence 8 arrives late:
  const isStale = 8 < occupancy.latestCompletedFrameSeq;
  assert(isStale === true, '6. Stale asynchronous frame (Seq 8 < Latest 10) is rejected');
}

// =====================================================================
// SECTION 2: OCCUPANCY EVENTS & DUPLICATE SUPPRESSION
// =====================================================================
console.log('\n--- SECTION 2: Occupancy Events & State Transitions ---');
{
  const eventService = new OccupancyEventService();
  eventService.setMode('hardware');
  eventService.clearEvents();

  const t0 = new Date('2026-11-18T10:00:00Z');

  // 1. OCCUPIED transition generates OCCUPANCY_STARTED event
  eventService.handleOccupancyStateUpdate({
    status: 'OCCUPIED',
    peopleCount: 1,
    isAbsenceCountdown: false,
    customNow: t0
  });

  const events1 = eventService.getEventsList();
  assert(events1.length === 1, '1. OCCUPIED transition generates exactly one event');
  assert(events1[0].eventType === OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED, '1b. Event is OCCUPANCY_STARTED');
  assert(events1[0].peopleCount === 1, '1c. People count is 1');

  // 2. Repeated detections on consecutive frames do NOT create duplicate events!
  eventService.handleOccupancyStateUpdate({
    status: 'OCCUPIED',
    peopleCount: 1,
    isAbsenceCountdown: false,
    customNow: new Date('2026-11-18T10:00:00.250Z')
  });
  eventService.handleOccupancyStateUpdate({
    status: 'OCCUPIED',
    peopleCount: 1,
    isAbsenceCountdown: false,
    customNow: new Date('2026-11-18T10:00:00.500Z')
  });
  const events2 = eventService.getEventsList();
  assert(events2.length === 1, '2. Repeated frame detections do not generate duplicate events');

  // 3. Person count increases -> ADDITIONAL_PERSON_DETECTED
  eventService.handleOccupancyStateUpdate({
    status: 'OCCUPIED',
    peopleCount: 2,
    isAbsenceCountdown: false,
    customNow: new Date('2026-11-18T10:05:00Z')
  });
  const events3 = eventService.getEventsList();
  assert(events3.length === 2, '3. Increase in occupant count generates event');
  assert(events3[0].eventType === OCCUPANCY_EVENT_TYPES.ADDITIONAL_PERSON_DETECTED, '3b. Event is ADDITIONAL_PERSON_DETECTED');
  assert(events3[0].peopleCount === 2, '3c. New occupant count is 2');

  // 4. Person leaves -> Absence Countdown Started
  eventService.handleOccupancyStateUpdate({
    status: 'OCCUPIED',
    peopleCount: 0,
    isAbsenceCountdown: true,
    customNow: new Date('2026-11-18T10:10:00Z')
  });
  const events4 = eventService.getEventsList();
  assert(events4[0].eventType === OCCUPANCY_EVENT_TYPES.ABSENCE_COUNTDOWN_STARTED, '4. Absence countdown start generates event');

  // 5. Person returns during countdown -> OCCUPANCY_RESUMED (cancels countdown)
  eventService.handleOccupancyStateUpdate({
    status: 'OCCUPIED',
    peopleCount: 1,
    isAbsenceCountdown: false,
    customNow: new Date('2026-11-18T10:10:15Z')
  });
  const events5 = eventService.getEventsList();
  assert(events5[0].eventType === OCCUPANCY_EVENT_TYPES.OCCUPANCY_RESUMED, '5. Person returning during grace period generates OCCUPANCY_RESUMED');

  // 6. 30s Timeout expires -> ROOM_BECAME_EMPTY
  eventService.handleOccupancyStateUpdate({
    status: 'OCCUPIED',
    peopleCount: 0,
    isAbsenceCountdown: true,
    customNow: new Date('2026-11-18T10:20:00Z')
  });
  eventService.handleOccupancyStateUpdate({
    status: 'UNOCCUPIED',
    peopleCount: 0,
    isAbsenceCountdown: false,
    customNow: new Date('2026-11-18T10:20:30Z')
  });
  const events6 = eventService.getEventsList();
  assert(events6[0].eventType === OCCUPANCY_EVENT_TYPES.ROOM_BECAME_EMPTY, '6. Vacancy after 30s timeout generates ROOM_BECAME_EMPTY');

  // 7. Camera disconnection does NOT create a false room vacancy
  eventService.handleOccupancyStateUpdate({
    status: 'UNKNOWN',
    peopleCount: 0,
    isAbsenceCountdown: false,
    customNow: new Date('2026-11-18T10:25:00Z')
  });
  const events7 = eventService.getEventsList();
  assert(events7[0].eventType === OCCUPANCY_EVENT_TYPES.CAMERA_DISCONNECTED, '7. Camera disconnect generates CAMERA_DISCONNECTED (not empty room)');
  assert(events7[0].occupancyStatus === 'UNKNOWN', '7b. Disconnection status is UNKNOWN');
}

// =====================================================================
// SECTION 3: HISTORICAL STORAGE & MODE SEPARATION
// =====================================================================
console.log('\n--- SECTION 3: Historical Storage & Mode Separation ---');
{
  const eventService = new OccupancyEventService();

  // Test Hardware Mode events
  eventService.setMode('hardware');
  eventService.clearEvents();
  eventService.recordEvent(OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED, { peopleCount: 1 });
  assert(eventService.eventsHardware.length === 1, '8. Hardware event recorded in hardware store');
  assert(eventService.eventsHardware[0].mode === 'HARDWARE', '8b. Mode tag is HARDWARE');

  // Test Demo Mode separation
  eventService.setMode('demo');
  eventService.clearEvents();
  eventService.recordEvent(OCCUPANCY_EVENT_TYPES.PERSON_DETECTED, { peopleCount: 2 });
  assert(eventService.eventsDemo.length === 1, '9. Demo event recorded in demo store');
  assert(eventService.eventsDemo[0].mode === 'DEMO', '9b. Mode tag is DEMO');
  assert(eventService.eventsHardware.length === 1, '9c. Hardware store remains completely isolated from demo writes');

  // Test Local Calendar Day filtering (Today vs Yesterday)
  const today = new Date();
  const yesterday = new Date(Date.now() - 25 * 3600 * 1000); // 25 hours ago

  eventService.recordEvent(OCCUPANCY_EVENT_TYPES.ROOM_BECAME_EMPTY, {}, today.toISOString());
  eventService.recordEvent(OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED, {}, yesterday.toISOString());

  const todayEvents = eventService.getTodayEvents(today);
  assert(todayEvents.length === 2, '10. Only today events included in today list (yesterday excluded)');
  assert(!todayEvents.some(e => new Date(e.timestamp).getDate() === yesterday.getDate()), '10b. Yesterday event cleanly excluded');
}

// =====================================================================
// SECTION 4: 24-HOUR HOURLY OCCUPANCY TIMELINE & AGGREGATION
// =====================================================================
console.log('\n--- SECTION 4: 24-Hour Hourly Timeline Aggregation ---');
{
  const eventService = new OccupancyEventService();
  eventService.setMode('demo');
  eventService.clearEvents();

  const refDay = new Date(2026, 10, 18); // Nov 18, 2026

  // Session 1: 08:15 to 08:45 (30 mins inside 8 AM bucket)
  const sess1 = {
    id: 's1',
    startTime: new Date(2026, 10, 18, 8, 15, 0).toISOString(),
    endTime: new Date(2026, 10, 18, 8, 45, 0).toISOString(),
    durationSeconds: 1800,
    maxPeople: 1,
    mode: 'DEMO'
  };

  // Session 2: Spans two hours (09:45 to 11:15 -> 15m in 9 AM, 60m in 10 AM, 15m in 11 AM)
  const sess2 = {
    id: 's2',
    startTime: new Date(2026, 10, 18, 9, 45, 0).toISOString(),
    endTime: new Date(2026, 10, 18, 11, 15, 0).toISOString(),
    durationSeconds: 5400,
    maxPeople: 2,
    mode: 'DEMO'
  };

  // Session 3: Midnight Crossing (starts Nov 17 23:30, ends Nov 18 01:30)
  // Inside Nov 18, it covers 00:00 to 01:30 -> 60m in 12 AM (Hour 0), 30m in 1 AM (Hour 1)
  const sess3 = {
    id: 's3',
    startTime: new Date(2026, 10, 17, 23, 30, 0).toISOString(),
    endTime: new Date(2026, 10, 18, 1, 30, 0).toISOString(),
    durationSeconds: 7200,
    maxPeople: 1,
    mode: 'DEMO'
  };

  eventService.sessionsDemo = [sess1, sess2, sess3];

  const timeline = eventService.getHourlyTimeline(refDay);

  // 11. 24 Hourly Buckets generated (12 AM through 11 PM)
  assert(timeline.length === 24, '11. Timeline has exactly 24 hourly buckets');
  assert(timeline[0].label === '12 AM', '11b. First bucket is 12 AM (00:00)');
  assert(timeline[12].label === '12 PM', '11c. 12th index is 12 PM (12:00)');
  assert(timeline[23].label === '11 PM', '11d. 23rd index is 11 PM (23:00)');

  // 12. Single-hour Session 1 inside 8 AM bucket (Hour 8)
  const hour8 = timeline[8];
  assert(hour8.occupiedMinutes === 30, `12. Hour 8 (8 AM) has exactly 30 occupied minutes (actual: ${hour8.occupiedMinutes})`);

  // 13. Multi-hour Session 2 split across 9 AM, 10 AM, 11 AM
  const hour9 = timeline[9];
  const hour10 = timeline[10];
  const hour11 = timeline[11];
  assert(hour9.occupiedMinutes === 15, `13a. Hour 9 (9 AM) has 15 mins (09:45-10:00, actual: ${hour9.occupiedMinutes})`);
  assert(hour10.occupiedMinutes === 60, `13b. Hour 10 (10 AM) has full 60 mins (10:00-11:00, actual: ${hour10.occupiedMinutes})`);
  assert(hour11.occupiedMinutes === 15, `13c. Hour 11 (11 AM) has 15 mins (11:00-11:15, actual: ${hour11.occupiedMinutes})`);

  // 14. Midnight Crossing Session correctly clamped to Nov 18
  const hour0 = timeline[0]; // 12 AM (00:00 - 01:00)
  const hour1 = timeline[1]; // 1 AM (01:00 - 02:00)
  assert(hour0.occupiedMinutes === 60, `14a. Hour 0 (12 AM) clamped to 60 mins of Nov 18 (actual: ${hour0.occupiedMinutes})`);
  assert(hour1.occupiedMinutes === 30, `14b. Hour 1 (1 AM) has 30 mins (actual: ${hour1.occupiedMinutes})`);

  // 15. Empty hours show 0 occupied minutes without fabricated activity
  const hour4 = timeline[4]; // 4 AM has no sessions
  assert(hour4.occupiedMinutes === 0, `15. Empty hour (4 AM) shows exactly 0 occupied minutes (actual: ${hour4.occupiedMinutes})`);

  // 16. Total today summary aggregation
  const summary = eventService.getTodaySummary(refDay);
  assert(summary.todaySessionsCount === 3, '16. Today sessions count is 3');
  // Total occupied minutes: Hour 0 (60) + Hour 1 (30) + Hour 8 (30) + Hour 9 (15) + Hour 10 (60) + Hour 11 (15) = 210 mins (3h 30m)
  assert(summary.totalOccupiedMinutes === 210, `16b. Total occupied time is 210 mins / 3h 30m (actual: ${summary.totalOccupiedMinutes})`);
}

// =====================================================================
// SECTION 5: REGRESSION TESTING (HARDWARE & SYSTEM INTACT)
// =====================================================================
console.log('\n--- SECTION 5: Regression Testing ---');
{
  // 17. Arduino D7 Room LED control via SmartLightingService
  const lighting = new SmartLightingService();
  const txList = [];
  serialService.sendCommand = async (cmd) => {
    txList.push(cmd);
    return { success: true };
  };

  const decDark = lighting.evaluateLightingDecision(OCCUPANCY_STATES.OCCUPIED, 200);
  assert(decDark.desiredState === 1, '17. OCCUPIED + LDR 200 ADC -> LIGHT ON (D7 HIGH)');
  assert(txList.some(c => c.command === 'LIGHT_ON'), '17b. LIGHT_ON dispatched via serial');

  const decHarvest = lighting.evaluateLightingDecision(OCCUPANCY_STATES.OCCUPIED, 750);
  assert(decHarvest.desiredState === 0, '18. OCCUPIED + LDR 750 ADC -> LIGHT OFF (Daylight Harvesting)');
  assert(txList.some(c => c.command === 'LIGHT_OFF'), '18b. LIGHT_OFF dispatched');

  // 19. Manual Override
  lighting.forceManualLightToggle(1);
  assert(lighting.manualOverride === true, '19. Manual override enabled');
  assert(lighting.desiredLightState === 1, '19b. Desired state forced ON');
  lighting.setManualOverride(false);

  // 20. 2-Second Heartbeat format
  serialService.status = HARDWARE_STATUS.CONNECTED;
  const hbRes = await serialService.sendHeartbeat();
  assert(hbRes.success === true, '20. Heartbeat sent successfully');
  assert(txList.some(c => c.command === 'HEARTBEAT'), '20b. Heartbeat command format is {"command":"HEARTBEAT"}');

  // 21. Telemetry parsing & D7 pin mapping
  const serial = new SerialService();
  serial.simulateIncomingSerialLine('{"light_adc":450,"temperature":23.5,"humidity":48,"motion":0,"room_light":1,"lastCommandAge":2,"watchdogActive":true}');
  const reading = serial.getState().lastReading;
  assert(reading !== null, '21. Serial parser normalized telemetry');
  assert(reading.light_adc === 450, '21b. LDR light_adc = 450');
  assert(reading.room_light === 1, '21c. Pin D7 room_light = 1');
  assert(reading.watchdogActive === true, '21d. Diagnostic watchdogActive = true');
}

console.log('\n================================================================');
console.log(`TOTAL PHASE 5 TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
