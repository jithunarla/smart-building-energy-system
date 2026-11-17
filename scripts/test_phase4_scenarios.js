/**
 * Phase 4 Comprehensive Automated Verification Suite (Tasks 22 & 23)
 * Tests:
 *  - Scenario 1: Daylight waste (Rule 1: LDR=750, PIR=1, RoomLight=1)
 *  - Scenario 2: Vacant space lighting (Rule 2: LDR=350, PIR=0, RoomLight=1)
 *  - Scenario 3: Abundant daylight overload (Rule 3: LDR=850, PIR=0, RoomLight=1)
 *  - Scenario 4: Low daylight task lighting required (Rule 4: LDR=200, PIR=1, RoomLight=0)
 *  - Scenario 5: High temperature (Rule 5: Temp=31.5°C)
 *  - Scenario 6: Low temperature (Rule 6: Temp=18.5°C)
 *  - Scenario 7: High humidity (Rule 7: Hum=75%)
 *  - Scenario 8: Low humidity (Rule 8: Hum=25%)
 *  - Scenario 9: Sensor fault isolation (Rule 9: LDR null / DHT11 null)
 *  - Scenario 10: Optimal energy-efficient state (Rule 10: LDR=650, PIR=1, RoomLight=0, Temp=24°C, Hum=50%)
 *  - Scenario 11: Alert deduplication & cooldown in AlertService
 *  - Scenario 12: Auto-resolution when condition clears & history logging
 *  - Section B: Recommendation engine coverage across all 5 categories
 *  - Section C: 120W Luminaire energy waste calculation engine
 */

import { evaluateAlerts, ALERT_CATEGORIES, ALERT_SEVERITY } from '../src/engine/alertEngine.js';
import { evaluateEnergyWaste } from '../src/engine/energyWasteEngine.js';
import { generateRecommendations, RECOMMENDATION_CATEGORIES } from '../src/engine/recommendationEngine.js';
import { AlertService } from '../src/services/alertService.js';

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
console.log('PHASE 4: INTELLIGENT ENERGY WASTE DETECTION & RECOMMENDATIONS');
console.log('================================================================');

// -----------------------------------------------------------------
// SCENARIO 1: Daylight Waste Detection (Rule 1)
// Conditions: LDR=750 (>=500), PIR=1, RoomLight=1
// Expected: Rule 1 Alert triggered, 120W waste, Lighting category recommendation
// -----------------------------------------------------------------
console.log('\n--- Scenario 1: Daylight Waste Detection (Rule 1) ---');
{
  const data = { light_adc: 750, temperature: 24.5, humidity: 50, motion: 1, room_light: 1 };
  const alerts = evaluateAlerts(data, true);
  const waste = evaluateEnergyWaste(data, true);
  const recs = generateRecommendations(data, true);

  const r1 = alerts.find(a => a.ruleNumber === 1 || a.id.includes('daylight-waste'));
  assert(r1 !== undefined, 'Rule 1 daylight waste alert generated');
  assert(waste.hasWaste === true, '120W energy waste flagged');
  assert(waste.wastedWatts === 120, 'Wasted wattage is exactly 120W');
  const lightingRec = recs.find(r => r.category === RECOMMENDATION_CATEGORIES.LIGHTING);
  assert(lightingRec !== undefined, 'Lighting optimization recommendation generated');
}

// -----------------------------------------------------------------
// SCENARIO 2: Vacant Space Lighting (Rule 2)
// Conditions: LDR=350, PIR=0 (Vacant), RoomLight=1
// Expected: Rule 2 Alert triggered (Critical), 120W waste
// -----------------------------------------------------------------
console.log('\n--- Scenario 2: Vacant Space Lighting (Rule 2) ---');
{
  const data = { light_adc: 350, temperature: 24.5, humidity: 50, motion: 0, room_light: 1 };
  const alerts = evaluateAlerts(data, false);
  const waste = evaluateEnergyWaste(data, false);
  const recs = generateRecommendations(data, false);

  const r2 = alerts.find(a => a.ruleNumber === 2 || a.id.includes('vacant-room'));
  assert(r2 !== undefined, 'Rule 2 vacant room lighting alert generated');
  assert(r2.severity === ALERT_SEVERITY.CRITICAL, 'Rule 2 severity is CRITICAL');
  assert(waste.hasWaste === true, 'Energy waste flagged for vacant room');
  assert(waste.wastedWatts === 120, 'Wasted load is 120W');
  const occRec = recs.find(r => r.category === RECOMMENDATION_CATEGORIES.OCCUPANCY);
  assert(occRec !== undefined, 'Occupancy management recommendation generated');
}

// -----------------------------------------------------------------
// SCENARIO 3: Abundant Daylight Overload (Rule 3)
// Conditions: LDR=850 (>=750), PIR=0, RoomLight=1
// Expected: Rule 3 Alert triggered (Critical), 120W waste
// -----------------------------------------------------------------
console.log('\n--- Scenario 3: Abundant Daylight Overload (Rule 3) ---');
{
  const data = { light_adc: 850, temperature: 24.5, humidity: 50, motion: 0, room_light: 1 };
  const alerts = evaluateAlerts(data, false);
  const waste = evaluateEnergyWaste(data, false);

  const r3 = alerts.find(a => a.ruleNumber === 3 || a.id.includes('abundant-daylight'));
  assert(r3 !== undefined, 'Rule 3 abundant daylight alert generated');
  assert(r3.severity === ALERT_SEVERITY.CRITICAL, 'Rule 3 severity is CRITICAL');
  assert(waste.hasWaste === true, 'Energy waste detected');
  assert(waste.wastedWatts === 120, '120W luminaire load identified');
}

// -----------------------------------------------------------------
// SCENARIO 4: Low Daylight Task Lighting Required (Rule 4)
// Conditions: LDR=200 (<500), PIR=1, RoomLight=0
// Expected: Rule 4 Advisory Alert triggered (Info), 0W waste
// -----------------------------------------------------------------
console.log('\n--- Scenario 4: Low Daylight Task Lighting Needed (Rule 4) ---');
{
  const data = { light_adc: 200, temperature: 24.5, humidity: 50, motion: 1, room_light: 0 };
  const alerts = evaluateAlerts(data, true);
  const waste = evaluateEnergyWaste(data, true);
  const recs = generateRecommendations(data, true);

  const r4 = alerts.find(a => a.ruleNumber === 4 || a.id.includes('task-lighting'));
  assert(r4 !== undefined, 'Rule 4 task lighting advisory alert generated');
  assert(r4.severity === ALERT_SEVERITY.INFO, 'Rule 4 severity is INFO');
  assert(waste.hasWaste === false, 'Zero energy waste (lights are legitimately off)');
  assert(waste.wastedWatts === 0, 'Wasted watts = 0');
  const taskRec = recs.find(r => r.id.includes('task-lighting'));
  assert(taskRec !== undefined, 'Task lighting recommendation generated');
}

// -----------------------------------------------------------------
// SCENARIO 5: High Indoor Temperature (Rule 5)
// Conditions: Temp=31.5°C (>28.0°C)
// Expected: Rule 5 Warning Alert, Environmental category
// -----------------------------------------------------------------
console.log('\n--- Scenario 5: High Indoor Temperature (Rule 5) ---');
{
  const data = { light_adc: 400, temperature: 31.5, humidity: 50, motion: 1, room_light: 1 };
  const alerts = evaluateAlerts(data, true);
  const recs = generateRecommendations(data, true);

  const r5 = alerts.find(a => a.ruleNumber === 5 || a.id.includes('high-temp'));
  assert(r5 !== undefined, 'Rule 5 high temperature alert generated');
  assert(r5.category === ALERT_CATEGORIES.ENVIRONMENTAL, 'Category is Environmental');
  const tempRec = recs.find(r => r.category === RECOMMENDATION_CATEGORIES.TEMPERATURE);
  assert(tempRec !== undefined, 'Temperature management recommendation generated');
}

// -----------------------------------------------------------------
// SCENARIO 6: Low Indoor Temperature (Rule 6)
// Conditions: Temp=18.5°C (<20.0°C)
// Expected: Rule 6 Warning Alert, Environmental category
// -----------------------------------------------------------------
console.log('\n--- Scenario 6: Low Indoor Temperature (Rule 6) ---');
{
  const data = { light_adc: 400, temperature: 18.5, humidity: 50, motion: 1, room_light: 1 };
  const alerts = evaluateAlerts(data, true);
  const recs = generateRecommendations(data, true);

  const r6 = alerts.find(a => a.ruleNumber === 6 || a.id.includes('low-temp'));
  assert(r6 !== undefined, 'Rule 6 low temperature alert generated');
  assert(r6.category === ALERT_CATEGORIES.ENVIRONMENTAL, 'Category is Environmental');
  const tempRec = recs.find(r => r.category === RECOMMENDATION_CATEGORIES.TEMPERATURE);
  assert(tempRec !== undefined, 'Temperature management recommendation generated');
}

// -----------------------------------------------------------------
// SCENARIO 7: High Relative Humidity (Rule 7)
// Conditions: Hum=75% (>65%)
// Expected: Rule 7 Warning Alert, Environmental category
// -----------------------------------------------------------------
console.log('\n--- Scenario 7: High Relative Humidity (Rule 7) ---');
{
  const data = { light_adc: 400, temperature: 24.0, humidity: 75, motion: 1, room_light: 1 };
  const alerts = evaluateAlerts(data, true);
  const recs = generateRecommendations(data, true);

  const r7 = alerts.find(a => a.ruleNumber === 7 || a.id.includes('high-humidity'));
  assert(r7 !== undefined, 'Rule 7 high humidity alert generated');
  assert(r7.category === ALERT_CATEGORIES.ENVIRONMENTAL, 'Category is Environmental');
  const humRec = recs.find(r => r.category === RECOMMENDATION_CATEGORIES.HUMIDITY);
  assert(humRec !== undefined, 'Humidity management recommendation generated');
}

// -----------------------------------------------------------------
// SCENARIO 8: Low Relative Humidity (Rule 8)
// Conditions: Hum=25% (<30%)
// Expected: Rule 8 Warning Alert, Environmental category
// -----------------------------------------------------------------
console.log('\n--- Scenario 8: Low Relative Humidity (Rule 8) ---');
{
  const data = { light_adc: 400, temperature: 24.0, humidity: 25, motion: 1, room_light: 1 };
  const alerts = evaluateAlerts(data, true);
  const recs = generateRecommendations(data, true);

  const r8 = alerts.find(a => a.ruleNumber === 8 || a.id.includes('low-humidity'));
  assert(r8 !== undefined, 'Rule 8 low humidity alert generated');
  assert(r8.category === ALERT_CATEGORIES.ENVIRONMENTAL, 'Category is Environmental');
  const humRec = recs.find(r => r.category === RECOMMENDATION_CATEGORIES.HUMIDITY);
  assert(humRec !== undefined, 'Humidity management recommendation generated');
}

// -----------------------------------------------------------------
// SCENARIO 9: Sensor Fault Isolation (Rule 9)
// Conditions: LDR=null or DHT11=null
// Expected: Rule 9 Fault Alert generated; NO false climate alerts triggered!
// -----------------------------------------------------------------
console.log('\n--- Scenario 9: Sensor Fault Isolation (Rule 9) ---');
{
  // Test LDR Fault:
  const ldrFaultData = { light_adc: null, temperature: 24.0, humidity: 50, motion: 0, room_light: 0 };
  const ldrAlerts = evaluateAlerts(ldrFaultData, false);
  const ldrFaultAlert = ldrAlerts.find(a => a.ruleNumber === 9 || a.id.includes('ldr-fault'));
  assert(ldrFaultAlert !== undefined, 'Rule 9 LDR fault alert generated when light_adc is null');
  assert(ldrFaultAlert.category === ALERT_CATEGORIES.SENSOR_FAULT, 'LDR fault categorized as Sensor Fault');

  // Test DHT11 Fault:
  const dhtFaultData = { light_adc: 600, temperature: null, humidity: null, motion: 0, room_light: 0 };
  const dhtAlerts = evaluateAlerts(dhtFaultData, false);
  const dhtFaultAlert = dhtAlerts.find(a => a.ruleNumber === 9 || a.id.includes('dht11-fault'));
  assert(dhtFaultAlert !== undefined, 'Rule 9 DHT11 fault alert generated when temp/hum is null');
  const falseTempAlert = dhtAlerts.find(a => a.ruleNumber === 5 || a.ruleNumber === 6);
  assert(falseTempAlert === undefined, 'No false temperature alert generated during sensor fault');
}

// -----------------------------------------------------------------
// SCENARIO 10: Optimal Energy-Efficient State (Rule 10)
// Conditions: LDR=650 (adequate daylight), PIR=1, RoomLight=0, Temp=24°C, Hum=50%
// Expected: Optimal / Efficient alert generated, 0W waste
// -----------------------------------------------------------------
console.log('\n--- Scenario 10: Optimal / Energy-Efficient State (Rule 10) ---');
{
  const data = { light_adc: 650, temperature: 24.0, humidity: 50, motion: 1, room_light: 0 };
  const alerts = evaluateAlerts(data, true);
  const waste = evaluateEnergyWaste(data, true);

  const optAlert = alerts.find(a => a.severity === ALERT_SEVERITY.EFFICIENT || a.id.includes('optimal'));
  assert(optAlert !== undefined, 'Optimal efficiency advisory generated');
  assert(waste.hasWaste === false, 'Zero energy wastage detected');
  assert(waste.wastedWatts === 0, 'Wasted load = 0W');
}

// -----------------------------------------------------------------
// SCENARIO 11: Alert Deduplication & Cooldown in AlertService
// Expected: Repeated evaluateAndSync does not inflate activeAlerts
// -----------------------------------------------------------------
console.log('\n--- Scenario 11: Alert Deduplication & Cooldown ---');
{
  const service = new AlertService();
  service.activeAlerts = [];
  service.resolvedAlerts = [];

  const wasteTelemetry = { light_adc: 750, temperature: 24.5, humidity: 50, motion: 1, room_light: 1 };
  
  // Call 1
  service.evaluateAndSync(wasteTelemetry, true);
  const count1 = service.getState().activeAlerts.length;
  assert(count1 >= 1, `First evaluation produces ${count1} active alert(s)`);

  // Call 2 (immediate repeat within 100ms)
  service.evaluateAndSync(wasteTelemetry, true);
  const count2 = service.getState().activeAlerts.length;
  assert(count2 === count1, 'Second evaluation with same telemetry does NOT duplicate active alerts');

  // Call 3
  service.evaluateAndSync(wasteTelemetry, true);
  const count3 = service.getState().activeAlerts.length;
  assert(count3 === count1, 'Third evaluation retains single unique alert instance');
}

// -----------------------------------------------------------------
// SCENARIO 12: Auto-Resolution When Condition Clears & History Logging
// Expected: Switching RoomLight from 1 to 0 auto-resolves Rule 1 daylight waste alert
// -----------------------------------------------------------------
console.log('\n--- Scenario 12: Auto-Resolution When Condition Clears ---');
{
  const service = new AlertService();
  service.activeAlerts = [];
  service.resolvedAlerts = [];

  // Step 1: Trigger daylight waste
  const wasteTelemetry = { light_adc: 750, temperature: 24.5, humidity: 50, motion: 1, room_light: 1 };
  service.evaluateAndSync(wasteTelemetry, true);
  const activeBefore = service.getState().activeAlerts;
  const hasDaylightWasteBefore = activeBefore.some(a => a.id.includes('daylight-waste'));
  assert(hasDaylightWasteBefore === true, 'Daylight waste alert active initially');

  // Step 2: Remediate by turning OFF luminaire (RoomLight = 0)
  const resolvedTelemetry = { light_adc: 750, temperature: 24.5, humidity: 50, motion: 1, room_light: 0 };
  service.evaluateAndSync(resolvedTelemetry, true);

  const activeAfter = service.getState().activeAlerts;
  const resolvedList = service.getState().resolvedAlerts;

  const hasDaylightWasteActiveAfter = activeAfter.some(a => a.id.includes('daylight-waste'));
  assert(hasDaylightWasteActiveAfter === false, 'Daylight waste alert removed from activeAlerts');

  const resolvedItem = resolvedList.find(r => r.id.includes('daylight-waste'));
  assert(resolvedItem !== undefined, 'Alert moved to resolvedAlerts history list');
  assert(resolvedItem.status === 'resolved', 'Resolved alert has status = resolved');
  assert(Boolean(resolvedItem.resolvedAt), 'Resolved alert includes resolution timestamp');
}

// -----------------------------------------------------------------
// SECTION B: Recommendation Engine Coverage (All 5 Categories)
// -----------------------------------------------------------------
console.log('\n--- Section B: Recommendation Engine Category Verification ---');
{
  // Test telemetry triggering each category
  const multiTelemetry = { light_adc: 800, temperature: 31.0, humidity: 75, motion: 0, room_light: 1 };
  const allRecs = generateRecommendations(multiTelemetry, false);

  const categoriesFound = new Set(allRecs.map(r => r.category));

  assert(categoriesFound.has(RECOMMENDATION_CATEGORIES.LIGHTING), 'Category 1: Lighting Optimization verified');
  assert(categoriesFound.has(RECOMMENDATION_CATEGORIES.OCCUPANCY), 'Category 2: Occupancy Management verified');
  assert(categoriesFound.has(RECOMMENDATION_CATEGORIES.TEMPERATURE), 'Category 3: Temperature Management verified');
  assert(categoriesFound.has(RECOMMENDATION_CATEGORIES.HUMIDITY), 'Category 4: Humidity Management verified');
  assert(categoriesFound.has(RECOMMENDATION_CATEGORIES.GENERAL), 'Category 5: General Energy Efficiency verified');

  allRecs.forEach(r => {
    assert(Boolean(r.title && r.suggestedAction && r.reason && r.expectedBenefit), `Recommendation '${r.title}' has all required fields`);
  });
}

// -----------------------------------------------------------------
// SECTION C: 120W Luminaire Energy Waste Calculation Engine
// -----------------------------------------------------------------
console.log('\n--- Section C: 120W Luminaire Energy Waste Calculation ---');
{
  // Daylight waste with light ON
  const w1 = evaluateEnergyWaste({ light_adc: 600, temperature: 24, humidity: 50, motion: 1, room_light: 1 }, true);
  assert(w1.hasWaste === true && w1.wastedWatts === 120, 'Daylight waste = 120W');

  // Vacant room with light ON
  const w2 = evaluateEnergyWaste({ light_adc: 200, temperature: 24, humidity: 50, motion: 0, room_light: 1 }, false);
  assert(w2.hasWaste === true && w2.wastedWatts === 120, 'Vacant space waste = 120W');

  // Normal legitimate light ON (dark room + occupied)
  const w3 = evaluateEnergyWaste({ light_adc: 200, temperature: 24, humidity: 50, motion: 1, room_light: 1 }, true);
  assert(w3.hasWaste === false && w3.wastedWatts === 0, 'Legitimate task lighting = 0W waste');

  // Light OFF (conserving)
  const w4 = evaluateEnergyWaste({ light_adc: 700, temperature: 24, humidity: 50, motion: 1, room_light: 0 }, true);
  assert(w4.hasWaste === false && w4.wastedWatts === 0, 'Light OFF = 0W waste');
}

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
