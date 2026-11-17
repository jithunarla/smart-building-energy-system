# AI Webcam Human Detection & Arduino Smart Lighting Setup Guide

This document describes the architecture, hardware pinout, bidirectional serial communication protocol, computer vision model pipeline, and operating instructions for the **Smart Building Energy Waste Detection & Sustainability Monitoring System (Phase 4)**.

---

## 1. System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                SYSTEM ARCHITECTURE                                │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  [ Built-in Laptop Webcam ]                                                       │
│          │                                                                        │
│          ▼                                                                        │
│  [ navigator.mediaDevices.getUserMedia ] (640x480 @ 30fps)                        │
│          │                                                                        │
│          ▼                                                                        │
│  [ TensorFlow.js + COCO-SSD Model ]                                               │
│          │ Client-side local inference (MobileNetV2 base)                         │
│          │ Class filter: 'person' (Confidence >= 0.60)                            │
│          ▼                                                                        │
│  [ Occupancy Detection Service ]                                                  │
│          │ 3 States: OCCUPIED (>=1 person),                                       │
│          │           UNOCCUPIED (0 persons for >45s grace period),                │
│          │           UNKNOWN (camera disconnected/error/standby)                  │
│          │                                                                        │
│          ├───────────────────────────────────────────────────────┐                │
│          ▼                                                       ▼                │
│  [ Smart Lighting Decision Engine ]                     [ Energy Waste Engine ]   │
│          │                                                       │                │
│          │ Inputs: Occupancy State + LDR ADC                     │ Active Waste:  │
│          │ Rule 1: OCCUPIED + LDR < 500  => LIGHT ON             │ 120W Luminaire │
│          │ Rule 2: OCCUPIED + LDR >= 500 => LIGHT OFF            │ Discharge Load │
│          │ Rule 3: UNOCCUPIED + Any LDR  => LIGHT OFF            │                │
│          │ Rule 4: UNKNOWN + Any LDR     => Safe Fallback (OFF)  ▼                │
│          │                                              [ Alert Engine ]          │
│          ▼                                              Rules 1 to 10             │
│  [ Serial Service Outbound Queue ]                                                │
│          │ JSON Framing: {"command":"LIGHT_ON"}\n                                 │
│          ▼                                                                        │
│  [ Web Serial API (navigator.serial) ] ── (9600 bps USB)                          │
│          │                                                                        │
│          ▼                                                                        │
│  [ Arduino Uno R3 Controller ]                                                    │
│          ├─► Pin D7: Room LED Output (220Ω demonstrator LED)                      │
│          ├─► Pin A0: LDR Photoresistor Input (0–1023 ADC)                         │
│          ├─► Pin D2: DHT11 Climate Sensor                                         │
│          ├─► Pins D9/D10/D11: Red/Yellow/Green Indicator LEDs                     │
│          └─► 10s Watchdog: Auto-cutoff on communication timeout                   │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hardware Pin Configuration

Use the confirmed hardware configuration:

| Component | Arduino Pin | Mode | Electrical & Circuit Connection |
|---|---|---|---|
| **LDR Photoresistor** | **A0 (Analog)** | `INPUT` | Voltage divider: 5V &rarr; LDR &rarr; Pin A0 &rarr; 10k&Omega; resistor &rarr; GND |
| **DHT11 Sensor** | **D2 (Digital)** | `INPUT` | Single-wire digital data line to Pin D2 with 5V VCC and GND |
| **Room Luminaire LED** | **D7 (Digital)** | `OUTPUT` | **EXCLUSIVELY PIN D7:** Pin D7 &rarr; 220&Omega; current-limiting resistor &rarr; LED Anode (+) &rarr; Cathode (-) &rarr; GND |
| **Red Alert LED** | **D9 (Digital)** | `OUTPUT` | Pin D9 &rarr; 220&Omega; &rarr; Red LED (Active energy waste indicator) |
| **Yellow Advisory LED** | **D10 (Digital)** | `OUTPUT` | Pin D10 &rarr; 220&Omega; &rarr; Yellow LED (Advisory / Unknown occupancy / Sensor fault) |
| **Green Efficiency LED** | **D11 (Digital)** | `OUTPUT` | Pin D11 &rarr; 220&Omega; &rarr; Green LED (Optimal daylight conservation mode) |
| **PIR Motion Sensor** | *DISABLED* | *NONE* | **Disabled / Not Used.** The laptop's built-in webcam replaces the faulty PIR sensor for human presence detection. |

> [!CAUTION]
> **Pin D7 is strictly reserved as an OUTPUT for the Room Demonstration LED.** Do not connect any PIR sensor to Pin D7. Use only low-voltage LEDs (5V with 220&Omega; resistor) for the demonstration. Never connect an Arduino pin directly to AC mains or household bulbs.

---

## 3. Required Arduino Libraries

1. **`dht` library** (by Rob Tillaart, version 0.1.36+ or compatible DHT11 library).
   - In Arduino IDE: Navigate to **Sketch** &rarr; **Include Library** &rarr; **Manage Libraries...**.
   - Search for `DHTlib` and click **Install**.

---

## 4. Firmware Upload Instructions

1. Connect your Arduino Uno R3 to your laptop using a standard USB-A to USB-B cable.
2. Launch the **Arduino IDE**.
3. Open [`hardware/smart_building_controller/smart_building_controller.ino`](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/hardware/smart_building_controller/smart_building_controller.ino).
4. Under **Tools** &rarr; **Board**, choose **Arduino Uno**.
5. Under **Tools** &rarr; **Port**, choose the assigned COM port (e.g., `COM3`, `COM4`, or `/dev/ttyUSB0`).
6. Click **Upload** (`Ctrl + U`).
7. **CRITICAL:** Once uploaded, close the Arduino IDE Serial Monitor window. If the Arduino IDE Serial Monitor is left open, the browser cannot open the COM port due to serial port locking.

---

## 5. Webcam Permission & Privacy Assurance

1. When navigating to **Occupancy Monitoring** (`/occupancy`), click the **Start Webcam** button.
2. The browser will prompt: *"localhost:3000 wants to use your camera"*. Click **Allow**.
3. **Privacy by Design:**
   - Inference runs **100% locally in-browser** using WebAssembly/WebGL hardware acceleration via TensorFlow.js.
   - **No video frames or images are ever uploaded to any cloud server or remote API.**
   - No biometric face recognition or personal identity tracking is performed; the model only identifies bounding boxes classified as generic `person`.
   - Clicking **Stop Webcam** or navigating away immediately terminates all camera tracks.

---

## 6. How to Connect Arduino Using Web Serial

1. Open the dashboard in **Google Chrome** or **Microsoft Edge** (browsers supporting the Web Serial API).
2. Click **Hardware Mode** in the top navigation bar.
3. In the hardware interface modal, ensure baud rate is set to **9600**.
4. Click **Connect Arduino**.
5. A browser serial chooser dialog will appear. Select your Arduino's serial device (e.g., `USB-SERIAL CH340` or `Arduino Uno`) and click **Connect**.
6. The connection indicator will turn green: `USB Serial Connected`. Telemetry streams will update live at 1 Hz.

---

## 7. Serial Communication Protocol

### Outbound Telemetry (Arduino &rarr; Browser)
Transmitted approximately once per second (`1000ms` non-blocking):
```json
{"light_adc":620,"temperature":24.5,"humidity":52,"motion":0,"room_light":0}
```
- `light_adc`: Ambient light sensor reading (0 to 1023 ADC).
- `temperature`: Temperature in °C (or `null` if DHT11 is disconnected).
- `humidity`: Relative humidity in % (or `null` if DHT11 is disconnected).
- `room_light`: Authoritative state read directly from physical pin D7 (`0` = OFF, `1` = ON).

### Inbound Commands (Browser &rarr; Arduino)
Transmitted over the Web Serial writable stream when the AI Smart Lighting Decision Engine changes state:
```json
{"command":"LIGHT_ON"}
{"command":"LIGHT_OFF"}
{"command":"SET_MANUAL_MODE","enabled":true}
{"command":"SET_AUTO_MODE"}
```

---

## 8. Smart Lighting Decision Logic

| Occupancy State | Natural Light (LDR ADC) | Lighting Action | Arduino Pin D7 | Serial Command Sent |
|---|---|---|---|---|
| **`OCCUPIED`** | **< 500 ADC (Dim / Darkness)** | **Turn Light ON** | `HIGH` (3.3V/5V) | `{"command":"LIGHT_ON"}` |
| **`OCCUPIED`** | **&ge; 500 ADC (Adequate / Abundant)** | **Turn Light OFF** | `LOW` (0V) | `{"command":"LIGHT_OFF"}` |
| **`UNOCCUPIED`** | Any LDR value | **Turn Light OFF** | `LOW` (0V) | `{"command":"LIGHT_OFF"}` |
| **`UNKNOWN`** | Any LDR value | **Safe Fallback (No Auto ON)** | `LOW` (0V) | None / Maintain Safe State |

### 45-Second Absence Grace Period
When the occupant leaves the camera's field of view, the system does not immediately turn the light off. An absence countdown (default: **45 seconds**) begins. If the person re-enters within 45 seconds, the countdown resets without interruption. If no person is seen for the entire 45 seconds, the state transitions to `UNOCCUPIED`, and the light is de-energized.

---

## 9. Manual Override Mode

- In **Smart Lighting** (`/smart-lighting`), click **Manual Override**.
- The operator can force the room LED ON or OFF using the toggle switch.
- Automatic AI decisions will not overwrite manual override commands until **Auto AI Mode** is re-enabled.

---

## 10. Communication Watchdog & Safety Failsafe

- If the browser closes, crashes, or the USB cable is unplugged while the light is ON in automatic mode, the Arduino firmware executes a **10-second communication watchdog**.
- If no valid commands or heartbeats are received for 10 consecutive seconds, the Arduino firmware automatically pulls Pin D7 `LOW`, extinguishing the room LED and activating the yellow advisory LED on Pin D10.

---

## 11. Demo Mode vs. Hardware Mode

- **Demo Mode:**
  - Operates completely without physical hardware or a webcam.
  - Features 7 simulated AI webcam scenarios:
    1. *Person in Dim Space (Task Lighting Required)*
    2. *Person in Abundant Daylight (Harvesting Active)*
    3. *Confirmed Unoccupied Room*
    4. *Person Recently Left (Absence Grace Countdown)*
    5. *Multiple Occupants Detected*
    6. *Camera Unavailable (UNKNOWN State)*
    7. *AI Model Failure (UNKNOWN State)*
- **Hardware Mode:**
  - Employs the real laptop webcam and real TensorFlow.js detection.
  - Streams live readings from Arduino Uno Pin A0 (LDR) and Pin D2 (DHT11).
  - Actuates physical demonstration LED on Pin D7.
  - Never overwrites hardware readings with simulated data.

---

## 12. Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| **Camera shows "Permission Denied"** | Browser permissions blocked | Click the lock/settings icon in the browser address bar &rarr; Set Camera to **Allow** &rarr; Reload. |
| **Serial shows "Failed to open serial port"** | Port locked by another program | Close Arduino IDE Serial Monitor, PuTTY, or other serial monitors before connecting. |
| **Room LED does not turn ON** | Wiring error or reverse LED polarity | Verify Pin D7 connects to 220&Omega; resistor &rarr; Long LED leg (Anode) &rarr; Short leg (Cathode) &rarr; GND. |
| **Model status shows "LOADING" indefinitely** | CDN script delay | Ensure laptop is connected to internet during initial load to fetch COCO-SSD model weights (~3 MB). |
| **Light turns OFF after 10 seconds** | Watchdog timeout | Normal failsafe behavior if browser stops streaming commands. Reconnect in Hardware Mode. |
