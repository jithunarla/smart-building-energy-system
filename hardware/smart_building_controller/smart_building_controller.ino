/*
 * =====================================================================================
 * Smart Building Energy Waste Detection & Sustainability Monitoring System
 * Firmware Controller for Arduino Uno R3 — Phase 4 AI Smart Lighting Integration
 * 
 * Hardware Inputs:
 *   - LDR Light Sensor: Analog A0 (Voltage divider with 10k resistor)
 *   - DHT11 Temperature & Humidity Sensor: Digital D2 (Single-wire bus)
 *   - PIR Sensor: DISABLED / NOT USED (Replaced by laptop webcam AI person detection)
 * 
 * Hardware Outputs:
 *   - Room LED / Luminaire Demonstration: Digital D7 (220 ohm resistor -> LED -> GND)
 *     **NOTE: Digital pin D7 is EXCLUSIVELY reserved for the Room LED output.**
 *   - Red Indicator LED: Digital D9 (Energy Waste / Anomaly Warning)
 *   - Yellow Indicator LED: Digital D10 (Advisory / Unknown Occupancy / Sensor Fault)
 *   - Green Indicator LED: Digital D11 (Optimal Energy Efficiency Mode)
 * 
 * Communication & Control:
 *   - Bidirectional USB Serial at 9600 baud (8-N-1)
 *   - Outbound: 1 Hz JSON telemetry stream containing LDR, DHT11, and actual room_light state
 *   - Inbound: Newline-delimited JSON commands from browser AI lighting decision engine:
 *       {"command":"LIGHT_ON"}
 *       {"command":"LIGHT_OFF"}
 *       {"command":"SET_MANUAL_MODE","enabled":true}
 *       {"command":"SET_AUTO_MODE"}
 *   - Watchdog: 10-second command timeout turns room LED OFF if communication drops in auto mode
 * =====================================================================================
 */

#include <dht.h> // Standard DHTLib by Rob Tillaart (or compatible DHT11 library)

// =====================================================================================
// CENTRALIZED PIN CONFIGURATION (Confirmed Phase 4 Hardware Mapping)
// =====================================================================================
const uint8_t PIN_LDR       = A0;  // LDR Photoresistor analog input
const uint8_t PIN_DHT11     = 2;   // DHT11 single-wire data line
const uint8_t PIN_LED_ROOM  = 7;   // Room LED Demonstration Output (EXCLUSIVELY PIN D7)
const uint8_t PIN_LED_RED   = 9;   // Red Indicator LED: Waste / Anomaly
const uint8_t PIN_LED_YEL   = 10;  // Yellow Indicator LED: Advisory / Unknown / Fault
const uint8_t PIN_LED_GRN   = 11;  // Green Indicator LED: Optimal Efficiency

// =====================================================================================
// OPERATIONAL CONSTANTS & WATCHDOG
// =====================================================================================
const unsigned long TELEMETRY_INTERVAL_MS = 1000UL;  // Telemetry stream broadcast (1 Hz)
const unsigned long WATCHDOG_TIMEOUT_MS   = 10000UL; // 10s timeout turns light OFF if disconnected
const int DAYLIGHT_THRESHOLD             = 500;     // LDR ADC >= 500 is adequate daylight

// =====================================================================================
// GLOBAL VARIABLES & SYSTEM STATE
// =====================================================================================
dht DHT;

unsigned long lastTelemetryMillis = 0;
unsigned long lastCommandMillis   = 0;
bool isManualMode                 = false; // When true, manual override prevents auto watchdog cut
int roomLightState                = 0;     // 0 = OFF (LOW), 1 = ON (HIGH)
String serialCommandBuffer        = "";

// =====================================================================================
// SETUP ROUTINE
// =====================================================================================
void setup() {
  // Initialize Serial communication at 9600 baud
  Serial.begin(9600);
  while (!Serial) {
    ; // Wait for native USB serial port (Leonardo / Micro / Uno WiFi if needed)
  }

  // Configure digital pin modes
  // IMPORTANT: PIN_LED_ROOM (Pin 7) is configured strictly as OUTPUT
  pinMode(PIN_LED_ROOM, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_YEL, OUTPUT);
  pinMode(PIN_LED_GRN, OUTPUT);

  // Initialize all outputs to safe default state (OFF)
  digitalWrite(PIN_LED_ROOM, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_YEL, LOW);
  digitalWrite(PIN_LED_GRN, LOW);

  roomLightState = 0;
  lastCommandMillis = millis();
  serialCommandBuffer.reserve(128);
}

// =====================================================================================
// INBOUND SERIAL COMMAND PROCESSOR
// Parses newline-delimited JSON commands sent from the web dashboard
// =====================================================================================
void processSerialCommand(const String& cmdStr) {
  lastCommandMillis = millis(); // Refresh communication watchdog timer

  // 1. Process HEARTBEAT command (Explicitly refreshes communication watchdog without modifying LED output)
  if (cmdStr.indexOf(F("\"command\":\"HEARTBEAT\"")) >= 0 || cmdStr.indexOf(F("\"HEARTBEAT\"")) >= 0) {
    // Watchdog refreshed by lastCommandMillis; do not change roomLightState or PIN_LED_ROOM
    return;
  }
  // 2. Process LIGHT_ON command
  else if (cmdStr.indexOf(F("\"command\":\"LIGHT_ON\"")) >= 0 || cmdStr.indexOf(F("\"LIGHT_ON\"")) >= 0) {
    roomLightState = 1;
    digitalWrite(PIN_LED_ROOM, HIGH);
  }
  // 3. Process LIGHT_OFF command
  else if (cmdStr.indexOf(F("\"command\":\"LIGHT_OFF\"")) >= 0 || cmdStr.indexOf(F("\"LIGHT_OFF\"")) >= 0) {
    roomLightState = 0;
    digitalWrite(PIN_LED_ROOM, LOW);
  }
  // 4. Process Manual Mode command
  else if (cmdStr.indexOf(F("SET_MANUAL_MODE")) >= 0) {
    isManualMode = true;
  }
  // 5. Process Auto Mode command
  else if (cmdStr.indexOf(F("SET_AUTO_MODE")) >= 0) {
    isManualMode = false;
  }
}

// =====================================================================================
// MAIN EXECUTION LOOP (Non-blocking using millis())
// =====================================================================================
void loop() {
  unsigned long currentMillis = millis();

  // 1. Non-blocking Serial Input Reader
  while (Serial.available() > 0) {
    char inChar = (char)Serial.read();
    if (inChar == '\n' || inChar == '\r') {
      if (serialCommandBuffer.length() > 0) {
        processSerialCommand(serialCommandBuffer);
        serialCommandBuffer = "";
      }
    } else {
      if (serialCommandBuffer.length() < 120) {
        serialCommandBuffer += inChar;
      }
    }
  }

  // 2. Communication Watchdog & Safety Failsafe
  // If the browser disconnects or stops sending commands while the light is ON,
  // turn the light OFF after 10 seconds of silence (unless manual mode is specifically set).
  if (!isManualMode && roomLightState == 1) {
    if (currentMillis - lastCommandMillis > WATCHDOG_TIMEOUT_MS) {
      roomLightState = 0;
      digitalWrite(PIN_LED_ROOM, LOW);
      digitalWrite(PIN_LED_YEL, HIGH); // Amber advisory indicator on timeout
    }
  }

  // 3. Periodic Sensor Sampling & Telemetry Broadcast (Every 1000ms)
  if (currentMillis - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = currentMillis;

    // Read LDR Photoresistor (0 to 1023 ADC)
    int lightAdc = analogRead(PIN_LDR);

    // Read DHT11 Temperature & Relative Humidity
    int chk = DHT.read11(PIN_DHT11);
    bool tempValid = (chk == DHTLIB_OK);
    float temperature = tempValid ? DHT.temperature : 0.0;
    float humidity    = tempValid ? DHT.humidity    : 0.0;

    // Authoritative Room Light Status: Read directly from physical pin D7
    int actualPinStatus = digitalRead(PIN_LED_ROOM);
    roomLightState = (actualPinStatus == HIGH) ? 1 : 0;

    // 4. Physical Indicator LED Status Logic
    // Red LED: Active energy waste (e.g., room light ON during bright daylight)
    bool isWaste = (lightAdc >= DAYLIGHT_THRESHOLD && roomLightState == 1);
    // Yellow LED: Climate advisory or sensor fault
    bool isAdvisory = (!tempValid) || (tempValid && (temperature > 28.0 || humidity > 65.0));
    // Green LED: Optimal conservation (daylight utilized, room light OFF)
    bool isOptimal = (roomLightState == 0 && lightAdc >= DAYLIGHT_THRESHOLD);

    digitalWrite(PIN_LED_RED, isWaste ? HIGH : LOW);
    digitalWrite(PIN_LED_YEL, isAdvisory ? HIGH : LOW);
    digitalWrite(PIN_LED_GRN, isOptimal ? HIGH : LOW);

    // 5. Diagnostic telemetry metrics
    unsigned long lastCommandAge = (currentMillis >= lastCommandMillis) ? ((currentMillis - lastCommandMillis) / 1000UL) : 0;
    bool watchdogActive = (!isManualMode && roomLightState == 1);

    // 6. Transmit Standard Newline-Delimited JSON Telemetry over Serial
    Serial.print(F("{\"light_adc\":"));
    Serial.print(lightAdc);

    Serial.print(F(",\"temperature\":"));
    if (tempValid) {
      Serial.print(temperature, 1);
    } else {
      Serial.print(F("null"));
    }

    Serial.print(F(",\"humidity\":"));
    if (tempValid) {
      Serial.print((int)humidity);
    } else {
      Serial.print(F("null"));
    }

    // PIR motion is deprecated (0), webcam AI manages occupancy decisions
    Serial.print(F(",\"motion\":0"));

    // Authoritative Room Light state on Pin D7
    Serial.print(F(",\"room_light\":"));
    Serial.print(roomLightState);

    // Diagnostic fields for AI camera, heartbeat and watchdog monitoring
    Serial.print(F(",\"roomLight\":"));
    Serial.print(roomLightState);
    Serial.print(F(",\"manualMode\":"));
    Serial.print(isManualMode ? F("true") : F("false"));
    Serial.print(F(",\"autoMode\":"));
    Serial.print(!isManualMode ? F("true") : F("false"));
    Serial.print(F(",\"lastCommandAge\":"));
    Serial.print(lastCommandAge);
    Serial.print(F(",\"watchdogActive\":"));
    Serial.print(watchdogActive ? F("true") : F("false"));

    Serial.println(F("}"));
  }
}
