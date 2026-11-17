# Arduino Firmware Controller — Phase 4 AI Smart Lighting Integration

## 📌 Hardware Pinout & Wiring Specifications

| Component | Arduino Pin | Mode | Wiring & Description |
|---|---|---|---|
| **LDR Photoresistor** | **A0 (Analog)** | `INPUT` | Voltage divider: 5V &rarr; LDR &rarr; Pin A0 &rarr; 10k&Omega; resistor &rarr; GND |
| **DHT11 Climate Sensor** | **D2 (Digital)** | `INPUT` | Single-wire data line to Pin D2 with 5V VCC and GND |
| **Room LED (Luminaire)** | **D7 (Digital)** | `OUTPUT` | **EXCLUSIVELY PIN D7:** Pin D7 &rarr; 220&Omega; resistor &rarr; LED Anode (+) &rarr; Cathode (-) &rarr; GND |
| **Red Alert LED** | **D9 (Digital)** | `OUTPUT` | Pin D9 &rarr; 220&Omega; &rarr; Red LED (Active energy waste indicator) |
| **Yellow Advisory LED** | **D10 (Digital)** | `OUTPUT` | Pin D10 &rarr; 220&Omega; &rarr; Yellow LED (Advisory / Unknown occupancy / Sensor fault) |
| **Green Efficiency LED** | **D11 (Digital)** | `OUTPUT` | Pin D11 &rarr; 220&Omega; &rarr; Green LED (Optimal daylight conservation mode) |
| **PIR Sensor** | *DISABLED* | *NONE* | **Disabled / Not Used.** The laptop's built-in webcam replaces the PIR sensor for AI-based person detection. |

> [!WARNING]
> **Digital Pin D7 is strictly dedicated to the Room Demonstration LED.** Do not connect any PIR motion sensor to Pin D7.

---

## ⚡ Serial Communication Protocol

- **Baud Rate:** `9600 bps` (8-N-1)
- **Framing:** Newline-delimited JSON strings (`\n`)

### Outbound Telemetry (Arduino &rarr; Browser)
Broadcast once every second (`1000ms` non-blocking):
```json
{"light_adc":620,"temperature":24.5,"humidity":52,"motion":0,"room_light":0}
```
- `light_adc`: Ambient light sensor reading (0 to 1023).
- `temperature`: Temperature in °C (or `null` if DHT11 fault occurs).
- `humidity`: Relative humidity in % (or `null` if DHT11 fault occurs).
- `room_light`: Authoritative hardware status of Pin D7 (`0` = OFF, `1` = ON).

### Inbound Commands (Browser &rarr; Arduino)
Sent when the AI Smart Lighting Decision Engine determines a state change or when the user invokes manual override:
```json
{"command":"LIGHT_ON"}
{"command":"LIGHT_OFF"}
{"command":"SET_MANUAL_MODE","enabled":true}
{"command":"SET_AUTO_MODE"}
```

### Safety Communication Watchdog
If the browser connection drops or crashes while the room LED is energized in automatic mode, the Arduino's 10-second communication watchdog will automatically de-energize Pin D7 to prevent indefinite energy burn.
