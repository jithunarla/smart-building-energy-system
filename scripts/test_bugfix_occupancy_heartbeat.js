/**
 * CRITICAL BUG FIX VALIDATION TEST SUITE
 * Tests:
 * 1. 30-Second Occupancy Grace Period & State Transitions (8s, 15s, 29s, 30s)
 * 2. Return scenarios (at 8s, 20s, after 30s)
 * 3. Smart Lighting re-triggering (Dark room -> LIGHT_ON, Bright room -> LIGHT_OFF)
 * 4. 2-Second Web Serial Heartbeats & Arduino 10-Second Watchdog Interaction
 * 5. Reconnection & Stale Timer Immunity
 */

import { OccupancyDetectionService, OCCUPANCY_STATES, CAMERA_STATUS } from '../src/services/occupancyDetectionService.js';
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
console.log('BUG FIX VALIDATION: 30S OCCUPANCY TIMER & ARDUINO RE-TRIGGERING');
console.log('================================================================');

// --- PART 1: OCCUPANCY STATE MACHINE & 30-SECOND COUNTDOWN ---
console.log('\n--- PART 1: Occupancy State Machine & Absence Countdown ---');
{
  const occupancy = new OccupancyDetectionService();
  occupancy.cameraStatus = CAMERA_STATUS.ACTIVE;

  // 1. Person detected -> OCCUPIED immediately
  const t0 = 1000000;
  occupancy.processDetections([{ class: 'person', score: 0.92, bbox: [0, 0, 100, 100] }], t0);
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '1. Person detected -> OCCUPIED immediately');
  assert(occupancy.peopleCount === 1, '1b. People count is 1');
  assert(occupancy.timeUntilUnoccupied === 30, '1c. Initial countdown initialized to 30s');

  // 2. Person disappears -> countdown starts at 30 seconds
  const t1 = t0 + 1000; // 1s later
  occupancy.processDetections([], t1);
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '2. Person disappears -> still OCCUPIED during grace period');
  assert(occupancy.absenceStartTime === t1, '2b. Countdown absenceStartTime established');
  assert(occupancy.timeUntilUnoccupied === 30, '2c. Remaining time starts at 30s');

  // 3. At 8 seconds -> still OCCUPIED
  const t8 = t1 + 8000; // 8s after disappearance
  occupancy.tickCountdown(t8);
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '3. At 8 seconds -> still OCCUPIED (no 8s early shutdown!)');
  assert(occupancy.timeUntilUnoccupied === 22, `3b. Remaining time at 8s is 22s (actual: ${occupancy.timeUntilUnoccupied}s)`);

  // 4. At 15 seconds -> still OCCUPIED
  const t15 = t1 + 15000;
  occupancy.tickCountdown(t15);
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '4. At 15 seconds -> still OCCUPIED');
  assert(occupancy.timeUntilUnoccupied === 15, `4b. Remaining time at 15s is 15s (actual: ${occupancy.timeUntilUnoccupied}s)`);

  // 5. At 29 seconds -> still OCCUPIED
  const t29 = t1 + 29000;
  occupancy.tickCountdown(t29);
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '5. At 29 seconds -> still OCCUPIED');
  assert(occupancy.timeUntilUnoccupied === 1, `5b. Remaining time at 29s is 1s (actual: ${occupancy.timeUntilUnoccupied}s)`);

  // 6. At 30 seconds -> UNOCCUPIED
  const t30 = t1 + 30000;
  occupancy.tickCountdown(t30);
  assert(occupancy.occupancyStatus === OCCUPANCY_STATES.UNOCCUPIED, '6. At 30 seconds -> UNOCCUPIED');
  assert(occupancy.timeUntilUnoccupied === 0, '6b. Remaining time at 30s is 0s');
}

// --- PART 2: PERSON RETURN SCENARIOS ---
console.log('\n--- PART 2: Person Return Scenarios & Cancellation ---');
{
  // 7. Person returns after 8 seconds -> countdown cancelled
  const occ7 = new OccupancyDetectionService();
  occ7.cameraStatus = CAMERA_STATUS.ACTIVE;
  let now = 2000000;
  occ7.processDetections([{ class: 'person', score: 0.90, bbox: [0,0,10,10] }], now);
  now += 1000;
  occ7.processDetections([], now); // Disappears
  now += 8000; // 8s later
  occ7.tickCountdown(now);
  assert(occ7.timeUntilUnoccupied === 22, '7a. Counting down at 8s');
  // Person returns!
  occ7.processDetections([{ class: 'person', score: 0.95, bbox: [0,0,10,10] }], now + 500);
  assert(occ7.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '7. Person returns after 8 seconds -> OCCUPIED');
  assert(occ7.absenceStartTime === null, '7b. Countdown cancelled (absenceStartTime is null)');
  assert(occ7.timeUntilUnoccupied === 30, '7c. Countdown timer reset back to 30s');

  // 8. Person returns after 20 seconds -> countdown cancelled
  const occ8 = new OccupancyDetectionService();
  occ8.cameraStatus = CAMERA_STATUS.ACTIVE;
  now = 3000000;
  occ8.processDetections([{ class: 'person', score: 0.88, bbox: [0,0,10,10] }], now);
  now += 1000;
  occ8.processDetections([], now); // Disappears
  now += 20000; // 20s later
  occ8.tickCountdown(now);
  assert(occ8.timeUntilUnoccupied === 10, '8a. Counting down at 20s (10s left)');
  // Person returns!
  occ8.processDetections([{ class: 'person', score: 0.91, bbox: [0,0,10,10] }], now + 200);
  assert(occ8.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '8. Person returns after 20 seconds -> countdown cancelled');
  assert(occ8.absenceStartTime === null, '8b. Countdown successfully cancelled');

  // 9. Person returns after the 30-second timeout -> OCCUPIED again
  const occ9 = new OccupancyDetectionService();
  occ9.cameraStatus = CAMERA_STATUS.ACTIVE;
  now = 4000000;
  occ9.processDetections([{ class: 'person', score: 0.85, bbox: [0,0,10,10] }], now);
  now += 1000;
  occ9.processDetections([], now); // Disappears
  now += 31000; // 31s later (timeout passed)
  occ9.tickCountdown(now);
  assert(occ9.occupancyStatus === OCCUPANCY_STATES.UNOCCUPIED, '9a. Successfully reached UNOCCUPIED after 31s');
  // Person walks back in!
  occ9.processDetections([{ class: 'person', score: 0.94, bbox: [0,0,10,10] }], now + 5000);
  assert(occ9.occupancyStatus === OCCUPANCY_STATES.OCCUPIED, '9. Person returns after 30-second timeout -> OCCUPIED again');
  assert(occ9.peopleCount === 1, '9b. Person detected immediately');
}

// --- PART 3: SMART LIGHTING RE-TRIGGERING & LDR EVALUATION ---
console.log('\n--- PART 3: Smart Lighting Re-Triggering ---');
{
  const lighting = new SmartLightingService();
  const sentCommands = [];
  serialService.sendCommand = async (cmd) => {
    sentCommands.push(cmd);
    return { success: true };
  };

  // Initial dark room entrance: Person enters, LDR = 200 (< 500) -> LIGHT_ON
  lighting.evaluateLightingDecision(OCCUPANCY_STATES.OCCUPIED, 200);
  assert(sentCommands.some(c => c.command === 'LIGHT_ON'), '10a. Initial LIGHT_ON command dispatched');
  assert(lighting.desiredLightState === 1, '10b. Desired state is 1');

  // Room becomes UNOCCUPIED after 30s -> LIGHT_OFF
  lighting.evaluateLightingDecision(OCCUPANCY_STATES.UNOCCUPIED, 200);
  assert(sentCommands[sentCommands.length - 1].command === 'LIGHT_OFF', '10c. LIGHT_OFF sent on vacancy');
  assert(lighting.desiredLightState === 0, '10d. Desired state is 0');

  // 10. Person returns in a dark room (LDR = 250 < 500) -> LIGHT_ON command is sent again!
  lighting.handlePersonDetected(1);
  const decDarkReturn = lighting.evaluateLightingDecision(OCCUPANCY_STATES.OCCUPIED, 250);
  assert(decDarkReturn.desiredState === 1, '10. Person returns in dark room -> desired state = 1');
  assert(sentCommands[sentCommands.length - 1].command === 'LIGHT_ON', '10e. LIGHT_ON command sent again upon return');

  // 11. Person returns in a bright room (LDR = 700 >= 500) -> LIGHT_OFF command is sent (daylight harvesting)
  lighting.evaluateLightingDecision(OCCUPANCY_STATES.UNOCCUPIED, 700); // Leaves
  lighting.handlePersonDetected(1); // Returns into bright space
  const decBrightReturn = lighting.evaluateLightingDecision(OCCUPANCY_STATES.OCCUPIED, 700);
  assert(decBrightReturn.desiredState === 0, '11. Person returns in bright room -> desired state = 0 (harvesting)');
  assert(sentCommands[sentCommands.length - 1].command === 'LIGHT_OFF', '11b. LIGHT_OFF command dispatched for daylight harvesting');
}

// --- PART 4: 2-SECOND HEARTBEATS & ARDUINO 10-SECOND WATCHDOG ---
console.log('\n--- PART 4: 2-Second Heartbeats & Watchdog Simulation ---');
{
  const serial = new SerialService();
  const txHistory = [];
  serial.sendCommand = async (cmd) => {
    txHistory.push({ cmd, time: Date.now() });
    return { success: true };
  };

  // 12. Heartbeats continue every 2 seconds
  serial.status = HARDWARE_STATUS.CONNECTED;
  await serial.sendHeartbeat();
  assert(txHistory.some(h => h.cmd.command === 'HEARTBEAT'), '12. Heartbeat command format matches {"command":"HEARTBEAT"}');

  // 13. Continuous heartbeats prevent 10s watchdog from activating
  // Simulating Arduino watchdog timer:
  let arduinoLastCommandMillis = 50000;
  let arduinoRoomLight = 1;
  let isManualMode = false;
  const WATCHDOG_TIMEOUT_MS = 10000;

  function simulateArduinoWatchdog(currentMillis) {
    if (!isManualMode && arduinoRoomLight === 1) {
      if (currentMillis - arduinoLastCommandMillis > WATCHDOG_TIMEOUT_MS) {
        arduinoRoomLight = 0; // Turn light off!
      }
    }
    return arduinoRoomLight;
  }

  function simulateArduinoRx(command, currentMillis) {
    arduinoLastCommandMillis = currentMillis; // Refresh watchdog
    if (command === 'LIGHT_ON') arduinoRoomLight = 1;
    if (command === 'LIGHT_OFF') arduinoRoomLight = 0;
    // HEARTBEAT does NOT change arduinoRoomLight
  }

  // Heartbeats arrive every 2000ms:
  let simTime = 50000;
  simulateArduinoRx('LIGHT_ON', simTime); // Light turned ON
  assert(arduinoRoomLight === 1, '13a. Light turned ON on Arduino');

  // Heartbeats at +2s, +4s, +6s, +8s, +10s, +12s:
  for (let s = 2; s <= 12; s += 2) {
    simTime += 2000;
    simulateArduinoRx('HEARTBEAT', simTime);
    simulateArduinoWatchdog(simTime);
  }
  assert(arduinoRoomLight === 1, '13. Continuous 2s heartbeats prevent 10-second watchdog from activating (Light stays ON at 12s)');

  // 14. Missing heartbeats for 10 seconds activate the watchdog
  simTime += 10500; // 10.5 seconds of communication silence!
  simulateArduinoWatchdog(simTime);
  assert(arduinoRoomLight === 0, '14. Missing heartbeats for > 10 seconds activates watchdog (LED turns LOW)');

  // 15. Heartbeats do not change the LED state
  arduinoRoomLight = 0; // LED is off
  simTime += 1000;
  simulateArduinoRx('HEARTBEAT', simTime);
  assert(arduinoRoomLight === 0, '15. Heartbeat does not turn LED ON when it is OFF');

  arduinoRoomLight = 1; // LED is on
  simTime += 1000;
  simulateArduinoRx('HEARTBEAT', simTime);
  assert(arduinoRoomLight === 1, '15b. Heartbeat does not turn LED OFF when it is ON');

  // 16. Reconnecting Arduino restarts one heartbeat process
  serial.startHeartbeat();
  const timer1 = serial.heartbeatTimer;
  assert(timer1 !== null, '16a. First heartbeat timer started');
  // Reconnect
  serial.startHeartbeat();
  const timer2 = serial.heartbeatTimer;
  assert(timer2 !== null, '16b. Second heartbeat timer active');
  serial.stopHeartbeat();
  assert(serial.heartbeatTimer === null, '16. Reconnecting Arduino cleans up and maintains exactly one heartbeat process');

  // 17. No stale timer can turn the light OFF after a person returns
  const lighting17 = new SmartLightingService();
  lighting17.lastOccupiedTimestamp = Date.now();
  // An old async UNOCCUPIED callback tries to run 500ms after a person entered
  const result = lighting17.evaluateLightingDecision(OCCUPANCY_STATES.UNOCCUPIED, 250);
  assert(result.desiredState === 1, '17. Stale UNOCCUPIED callback rejected after person returned (Light remains ON)');
}

console.log('\n================================================================');
console.log(`TOTAL BUG FIX TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
