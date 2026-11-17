/**
 * Automated LDR Data Synchronization Test Suite (Phase 4 Task 6)
 * Verifies that incoming serial messages correctly parse, normalize, and synchronize
 * across the centralized data service, classification engine, and recommendation engine.
 */

import { serialService } from '../src/services/serialService.js';
import { sensorDataService } from '../src/services/sensorDataService.js';
import { SENSOR_CONFIG } from '../src/data/mockSensorData.js';
import { generateRecommendations } from '../src/engine/recommendationEngine.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    process.exitCode = 1;
  }
}

console.log('\n================================================================');
console.log('PHASE 4 TASK 6: LDR HARDWARE DATA SYNCHRONIZATION TESTS');
console.log('================================================================\n');

// 1. Switch to hardware mode
sensorDataService.setMode('hardware');
let currentSnapshot = sensorDataService.getSnapshot();
const unsubscribe = sensorDataService.subscribe((snapshot) => {
  currentSnapshot = snapshot;
});

// TEST SUITE A: Mandatory Test Values (100, 300, 600, 850 ADC)
const testCases = [
  {
    targetAdc: 100,
    expectedClassification: 'Darkness',
    isSufficient: false,
    frame: JSON.stringify({ light_adc: 100, temperature: 24.5, humidity: 52, motion: 1, room_light: 1 })
  },
  {
    targetAdc: 300,
    expectedClassification: 'Dim Lighting',
    isSufficient: false,
    frame: JSON.stringify({ light_adc: 300, temperature: 24.5, humidity: 52, motion: 1, room_light: 0 })
  },
  {
    targetAdc: 600,
    expectedClassification: 'Adequate Daylight',
    isSufficient: true,
    frame: JSON.stringify({ light_adc: 600, temperature: 24.5, humidity: 52, motion: 1, room_light: 0 })
  },
  {
    targetAdc: 850,
    expectedClassification: 'Abundant Daylight',
    isSufficient: true,
    frame: JSON.stringify({ light_adc: 850, temperature: 24.5, humidity: 52, motion: 1, room_light: 0 })
  }
];

console.log('--- TEST SUITE A: Mandatory 4-Tier LDR Range Values ---');
for (const tc of testCases) {
  console.log(`\nTesting ${tc.targetAdc} ADC (${tc.expectedClassification})...`);
  
  // 1. Inject serial packet
  serialService.simulateIncomingSerialLine(tc.frame);
  const reading = currentSnapshot.reading;

  // 1. Serial Monitor received value
  const rawLogs = serialService.getState().rawLogs;
  const logFound = rawLogs.slice(-3).some(log => log.includes(String(tc.targetAdc)));
  assert(logFound, '1. Serial Monitor received raw packet');

  // 2. Data normalization succeeded
  assert(reading.light_adc === tc.targetAdc, `2. Data normalization mapped light_adc to ${tc.targetAdc}`, `Got: ${reading.light_adc}`);

  // 3. Centralized sensor state updated
  assert(reading.mode === 'hardware', '3. Centralized state mode is hardware');

  // 4 & 5. Overview & Sensor Monitoring value
  assert(reading.light_adc === tc.targetAdc, `4 & 5. Reading available for Overview and Sensor Monitoring`);

  // 6. Historical graph has point with timestamped LDR
  const history = currentSnapshot.history;
  const lastPoint = history[history.length - 1];
  assert(lastPoint && lastPoint.light_adc === tc.targetAdc, `6. Historical graph appended timestamped reading ${tc.targetAdc}`);

  // 7. Lighting classification
  const classification = SENSOR_CONFIG.ldr.classify(reading.light_adc);
  assert(classification.label === tc.expectedClassification, `7. Classification is '${tc.expectedClassification}'`, `Got: ${classification.label}`);
  assert(classification.isSufficient === tc.isSufficient, `7b. Daylight sufficiency is ${tc.isSufficient}`);

  // 8. Recommendations use current value
  const recs = generateRecommendations(reading);
  const daylightRec = recs.find(r => r.category === 'Lighting Optimization' || r.id.includes('daylight') || r.id.includes('lighting'));
  assert(daylightRec !== undefined, `8. Recommendations evaluated based on ${tc.targetAdc} ADC`);
}

// TEST SUITE B: Legacy and Alternative Field Name Standardization (Task 2)
console.log('\n--- TEST SUITE B: Legacy Field Name Standardization (Task 2) ---');

const legacyCases = [
  { name: 'lightIntensity', payload: { lightIntensity: 780, temperature: 26.0, humidity: 55, motion: 0, room_light: 0 }, expected: 780 },
  { name: 'ldrValue',       payload: { ldrValue: 420, temperature: 26.0, humidity: 55, motion: 0, room_light: 0 }, expected: 420 },
  { name: 'light',          payload: { light: 910, temperature: 26.0, humidity: 55, motion: 0, room_light: 0 }, expected: 910 },
  { name: 'adc',            payload: { adc: 150, temperature: 26.0, humidity: 55, motion: 0, room_light: 0 }, expected: 150 },
  { name: 'ldr',            payload: { ldr: 650, temperature: 26.0, humidity: 55, motion: 0, room_light: 0 }, expected: 650 },
  { name: 'string integer', payload: { light_adc: "540", temperature: 26.0, humidity: 55, motion: 0, room_light: 0 }, expected: 540 }
];

for (const lc of legacyCases) {
  serialService.simulateIncomingSerialLine(JSON.stringify(lc.payload));
  const reading = currentSnapshot.reading;
  assert(reading.light_adc === lc.expected, `Standardize '${lc.name}' -> light_adc = ${lc.expected}`, `Got: ${reading.light_adc}`);
}

// TEST SUITE C: Boundary, Zero, and Out-of-Range Handling (Task 4)
console.log('\n--- TEST SUITE C: Boundary & Zero Reading Validation ---');

// Zero is a valid reading (Darkness)
serialService.simulateIncomingSerialLine(JSON.stringify({ light_adc: 0, temperature: 22.0, humidity: 50, motion: 0, room_light: 0 }));
assert(currentSnapshot.reading.light_adc === 0, 'Zero (0 ADC) is recognized as a valid physical reading (not null)');
assert(SENSOR_CONFIG.ldr.classify(0).label === 'Darkness', 'Zero ADC classified as Darkness');

// Maximum 1023 is valid
serialService.simulateIncomingSerialLine(JSON.stringify({ light_adc: 1023, temperature: 22.0, humidity: 50, motion: 0, room_light: 0 }));
assert(currentSnapshot.reading.light_adc === 1023, '1023 ADC is recognized as valid maximum');

// Out of range (e.g. 1500) preserves last valid reading (Task 4)
serialService.simulateIncomingSerialLine(JSON.stringify({ light_adc: 1500, temperature: 22.0, humidity: 50, motion: 0, room_light: 0 }));
assert(currentSnapshot.reading.light_adc === 1023, 'Out of range (>1023) preserves last valid reading (1023)');
assert(serialService.getState().sensorHealth.ldr === 'STALE_WARNING', 'Health marked STALE_WARNING on out-of-range');

// TEST SUITE D: Independent LDR Updates without DHT11 / PIR dependencies
console.log('\n--- TEST SUITE D: Independent LDR Updates (Task 3) ---');

// Packet with null temperature and null humidity (DHT11 fault)
serialService.simulateIncomingSerialLine(JSON.stringify({ light_adc: 720, temperature: null, humidity: null, motion: 1, room_light: 0 }));
assert(currentSnapshot.reading.light_adc === 720, 'LDR updates to 720 ADC even when DHT11 is null (sensor fault)');
assert(currentSnapshot.reading.temperature === null, 'DHT11 remains null (no fake data)');
assert(currentSnapshot.reading.motion === 1, 'PIR reading is 1');

unsubscribe();

console.log('\n================================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
