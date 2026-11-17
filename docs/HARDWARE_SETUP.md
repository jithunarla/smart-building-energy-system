# Hardware Setup, Wiring & Firmware Upload Guide

## Smart Building Energy Waste Detection & Sustainability Monitoring System

---

## 1. Bill of Materials (BOM)

| Component | Quantity | Specifications | Purpose |
|---|---|---|---|
| **Microcontroller** | 1 | Arduino Uno R3 (ATmega328P) | Physical telemetry acquisition & actuator control |
| **Light Sensor** | 1 | LDR GL5528 Photoresistor | Ambient daylight intensity sensing (0–1023 ADC) |
| **Climate Sensor** | 1 | DHT11 Temperature & Humidity Sensor | Environmental monitoring (0–50°C, 20–90% RH) |
| **Room LED** | 1 | 5mm White / Amber LED | Physical room luminaire demonstration on **Pin D7** |
| **Alert LED** | 1 | 5mm Red LED | Active energy waste indicator on **Pin D9** |
| **Advisory LED** | 1 | 5mm Yellow LED | Climate advisory / Unknown state on **Pin D10** |
| **Efficiency LED** | 1 | 5mm Green LED | Optimal daylight conservation mode on **Pin D11** |
| **Resistors** | 4 | 220 &Omega; (1/4 W) | Current-limiting resistors for the 4 LEDs |
| **Resistor** | 1 | 10 k&Omega; (1/4 W) | Voltage divider pull-down resistor for LDR |
| **Breadboard** | 1 | Standard 400-point / 830-point breadboard | Circuit prototyping |
| **Jumper Wires** | ~15 | Male-to-Male / Male-to-Female | Interconnections |
| **USB Cable** | 1 | USB Type-A to Type-B | Arduino communication & 5V power supply |
| **Computer Vision** | 1 | Laptop built-in webcam or USB webcam | AI-based human presence detection (replaces PIR) |

---

## 2. Arduino Uno Pinout & Wiring Specifications

| Component | Arduino Pin | Mode | Detailed Wiring Circuit |
|---|---|---|---|
| **LDR Photoresistor** | **A0 (Analog)** | `INPUT` | **Voltage Divider:**<br>• Arduino 5V &rarr; LDR Terminal 1<br>• LDR Terminal 2 &rarr; Arduino Pin A0 & 10k&Omega; Resistor<br>• 10k&Omega; Resistor &rarr; Arduino GND |
| **DHT11 Climate Sensor** | **D2 (Digital)** | `INPUT` | **Single-Wire Digital Line:**<br>• Pin 1 (VCC) &rarr; Arduino 5V<br>• Pin 2 (DATA) &rarr; Arduino Pin D2<br>• Pin 4 (GND) &rarr; Arduino GND<br>*(If using a 4-pin bare sensor without breakout board, place 10k pull-up between VCC and DATA)* |
| **Room Luminaire LED** | **D7 (Digital)** | `OUTPUT` | **EXCLUSIVELY PIN D7:**<br>• Arduino Pin D7 &rarr; 220&Omega; Resistor &rarr; LED Anode (+, long leg)<br>• LED Cathode (-, short leg) &rarr; Arduino GND |
| **Red Alert LED** | **D9 (Digital)** | `OUTPUT` | • Arduino Pin D9 &rarr; 220&Omega; &rarr; Red LED Anode (+)<br>• Red LED Cathode &rarr; Arduino GND |
| **Yellow Advisory LED** | **D10 (Digital)** | `OUTPUT` | • Arduino Pin D10 &rarr; 220&Omega; &rarr; Yellow LED Anode (+)<br>• Yellow LED Cathode &rarr; Arduino GND |
| **Green Efficiency LED** | **D11 (Digital)** | `OUTPUT` | • Arduino Pin D11 &rarr; 220&Omega; &rarr; Green LED Anode (+)<br>• Green LED Cathode &rarr; Arduino GND |
| **PIR Motion Sensor** | *DISABLED* | *NONE* | **Disabled / Not Used.** The laptop webcam and TensorFlow.js COCO-SSD person detection model replace the PIR sensor. |

> [!WARNING]
> **Pin D7 Exclusivity Rule:**  
> Digital pin **D7** is exclusively wired to the **Room Demonstration LED**. Under no circumstances should an external sensor or PIR sensor be wired to Pin D7.

---

## 3. Firmware Installation & Upload Process

The Arduino sketch is located at:
[`hardware/smart_building_controller/smart_building_controller.ino`](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/hardware/smart_building_controller/smart_building_controller.ino)

### Step-by-Step Upload Instructions:
1. Open the **Arduino IDE** (v1.8.x or v2.x).
2. Install the required DHT library:
   - Go to **Tools &rarr; Manage Libraries...**
   - Search for **`dht`** by Rob Tillaart (or compatible DHTLib).
   - Click **Install**.
3. Open `smart_building_controller.ino` from the project repository.
4. Connect the Arduino Uno R3 to your laptop via the USB cable.
5. In Arduino IDE:
   - Go to **Tools &rarr; Board** and select **Arduino Uno**.
   - Go to **Tools &rarr; Port** and select the active COM port (e.g., `COM3`, `COM4` on Windows; `/dev/ttyUSB0` or `/dev/tty.usbmodem` on macOS/Linux).
6. Click the **Upload** button ($\rightarrow$).
7. Once upload completes, verify that the TX/RX LEDs blink briefly.
8. **CRITICAL:** Close the Arduino IDE Serial Monitor window. If the Arduino IDE Serial Monitor remains open, it will lock the COM port, preventing the browser from accessing it.

---

## 4. Web Serial Browser Requirements & Connection Protocol

### Supported Browsers:
- **Google Chrome** (v89+)
- **Microsoft Edge** (v89+)
- **Opera** (v75+)
- *(Mozilla Firefox and Apple Safari do not natively support the Web Serial API; use Chrome or Edge).*

### Connecting the Dashboard to Hardware:
1. Start the React development server:
   ```bash
   npm run dev
   ```
2. Open the URL in Google Chrome (e.g., `http://localhost:5173/`).
3. Click the **Hardware Mode** button in the top navigation bar.
4. Click **Connect Arduino**.
5. A browser prompt will list available USB Serial devices. Select **Arduino Uno (COMx)** and click **Connect**.
6. The connection badge will turn green (`CONNECTED`), and real-time telemetry will stream at 1 Hz in the Serial Monitor tab.

---

## 5. Communication Protocol & Safety Failsafes

### Telemetry Stream (Arduino &rarr; Browser):
The Arduino broadcasts 1 packet every second (`1000 ms` non-blocking):
```json
{"light_adc":320,"temperature":24.5,"humidity":52,"motion":0,"room_light":1,"manualMode":false,"autoMode":true,"lastCommandAge":1,"watchdogActive":true}
```

### Command Protocol (Browser &rarr; Arduino):
- `{"command":"LIGHT_ON"}`: Energizes Pin D7.
- `{"command":"LIGHT_OFF"}`: De-energizes Pin D7.
- `{"command":"HEARTBEAT"}`: Sent every 2000 ms to refresh the hardware watchdog.
- `{"command":"SET_MANUAL_MODE"}`: Enables manual override.
- `{"command":"SET_AUTO_MODE"}`: Resumes automated algorithmic control.

### Hardware Watchdog Behavior:
If the laptop disconnects, closes the tab, or crashes while the room LED is ON in automatic mode, the Arduino's internal timer detects $>10\text{ seconds}$ without a command or heartbeat and automatically turns Pin D7 **OFF**. This ensures that room lights cannot be left burning indefinitely.
