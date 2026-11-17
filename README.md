# Smart Building Energy Waste Detection & Sustainability Monitoring System

An enterprise-grade, modern, and fully responsive commercial building energy waste detection and sustainability monitoring dashboard built with **React, Vite, Tailwind CSS, TensorFlow.js, and Web Serial API**.

The system monitors environmental conditions, performs edge AI human presence detection, communicates with physical IoT hardware via the browser-native **Web Serial API**, tracks second-by-second lighting operating intervals, quantifies avoidable electrical energy waste, estimates baseline cost savings, and generates downloadable compliance reports.

---

## 🌟 Key Highlights & Core Capabilities

1. **Edge AI Human Presence Detection:** Real-time client-side person detection using **TensorFlow.js and COCO-SSD** via the laptop webcam. Replaces traditional PIR sensors to eliminate false-vacancy errors when occupants sit stationary.
2. **Intelligent 30-Second Absence Grace Period:** Initiates a visual 30s countdown when occupants leave the frame. Returning cancels the countdown immediately, preventing light flickering.
3. **Physical Arduino Uno R3 IoT Integration:** Bidirectional serial communication at 9600 baud controlling the physical **Room Demonstration LED on Digital Pin D7**, reading ambient light from an **LDR on Pin A0**, and reading temperature/humidity from a **DHT11 on Pin D2**.
4. **Autonomous Communication Watchdog:** 2-second browser heartbeat with an autonomous 10-second Arduino firmware communication watchdog that de-energizes Pin D7 if connection drops in automatic mode.
5. **Advanced Energy Analytics Engine:** Mathematical calculation of Energy (kWh) and Electricity Cost (₹) for a configured 9 W LED rating and ₹8.00/kWh tariff.
6. **Occupancy vs. Lighting Correlation:** Cross-references occupancy session intervals against lighting intervals to isolate useful task lighting from avoidable vacant drain and daylight overload.
7. **Downloadable Sustainability & Audit Reports:** Generates executive printable PDF reports and raw CSV dataset exports.
8. **Dual Mode Architecture (Absolute Isolation):** Full **Demo Mode** with realistic simulations and rich pre-seeded data, alongside **Hardware Mode** driven strictly by real physical hardware, with zero storage cross-contamination.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, Vite v6.0.1 |
| **Styling & UI Design** | Tailwind CSS (Dark theme with emerald accents) |
| **Iconography** | Lucide React |
| **Data Visualization** | Recharts (Area, Bar, Line, and Composition charts) |
| **Routing & Navigation** | React Router DOM v6 (8 dedicated routes) |
| **Edge Computer Vision** | TensorFlow.js v4.x, COCO-SSD object detection |
| **Hardware Communication** | Native Web Serial API (`navigator.serial` at 9600 bps) |
| **Microcontroller Firmware** | Arduino C++ / Wiring (`smart_building_controller.ino`) |
| **State & Persistence** | Centralized React Context API, Browser LocalStorage |

---

## 🔌 Hardware Setup & Pinout Mapping

Detailed wiring diagrams and upload instructions are documented in [`docs/HARDWARE_SETUP.md`](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/docs/HARDWARE_SETUP.md).

| Component | Arduino Pin | Mode | Purpose | Circuit Notes |
|---|---|---|---|---|
| **LDR Photoresistor** | **A0 (Analog)** | `INPUT` | Daylight Intensity (0–1023 ADC) | Voltage divider with 10k&Omega; pull-down to GND |
| **DHT11 Sensor** | **D2 (Digital)** | `INPUT` | Temperature & Relative Humidity | Single-wire digital data line to Pin D2 |
| **Room LED (Luminaire)** | **D7 (Digital)** | `OUTPUT` | **EXCLUSIVELY PIN D7** | 220&Omega; current-limiting resistor to LED Anode (+) |
| **Red Alert LED** | **D9 (Digital)** | `OUTPUT` | Active Energy Waste Indicator | 220&Omega; resistor &rarr; Red LED |
| **Yellow Advisory LED** | **D10 (Digital)** | `OUTPUT` | Climate Advisory / Sensor Fault | 220&Omega; resistor &rarr; Yellow LED |
| **Green Efficiency LED** | **D11 (Digital)** | `OUTPUT` | Optimal Daylight Conservation Mode | 220&Omega; resistor &rarr; Green LED |
| **PIR Sensor** | *DISABLED* | *NONE* | Replaced by Webcam AI | **Disabled / Not Used.** |

> [!WARNING]
> **Pin D7 Exclusivity:** Digital Pin D7 is exclusively wired to the Room Demonstration LED. Do not connect a PIR sensor to Pin D7.

---

## 📱 Dashboard Navigation (8 Specialized Pages)

1. **Overview (`/overview`):** Top-level telemetry KPI cards, environmental waveforms, occupancy preview, room luminaire status, and sustainability gauges.
2. **Live Sensor Monitoring (`/sensor-monitoring`):** Hardware diagnostics for LDR A0, DHT11 D2, Room LED D7, and human presence timeline.
3. **Occupancy Monitoring (`/occupancy`):** Real-time webcam AI person detection view, confidence threshold slider, 30s absence countdown, today's triggers, and 24-hour activity timeline.
4. **Smart Lighting (`/smart-lighting`):** Algorithmic truth-table matrix, virtual room graphic, and manual override toggle.
5. **Energy Waste Alerts (`/alerts`):** Real-time anomaly detection, active alert filtering, severity categorization, and resolution history.
6. **Smart Recommendations (`/recommendations`):** Evidence-based optimization suggestions with potential kilowatt-hour and cost impact estimates.
7. **Energy Analytics (`/energy-analytics`):** Phase 6 dedicated analytics hub with 5 summary cards, Recharts trends (Daily/Weekly/Monthly), Occupancy vs Lighting alignment, editable energy parameters (9 W, ₹8/kWh), and PDF/CSV report export.
8. **Sustainability & Analytics (`/sustainability`):** Composite ASHRAE comfort scoring, subsystem efficiency indices, and 7-day environmental analytics.

---

## ⚡ Energy Calculation Methodology & Technical Disclosures

$$\text{Energy (kWh)} = \frac{\text{Power (Watts)} \times \text{Operating Time (Hours)}}{1000}$$
$$\text{Cost (₹)} = \text{Energy (kWh)} \times \text{Tariff (₹/kWh)}$$

At the configured defaults of **9 W Room LED** and **₹8.00 / kWh**:
- **1 hour of LED operation:** $0.009\text{ kWh} \rightarrow ₹0.072$
- **10 hours of LED operation:** $0.090\text{ kWh} \rightarrow ₹0.720$
- **100 hours of LED operation:** $0.900\text{ kWh} \rightarrow ₹7.200$

> [!IMPORTANT]
> **Measurement Limitations Disclosure:**  
> The physical IoT setup does not include an electrical current or power transducer. All electrical energy and cost values are **mathematical estimates** derived from confirmed physical operating runtimes on Arduino Pin D7 and configured device wattage.

---

## 🚀 Installation & Execution

### Prerequisites:
- **Node.js:** v18.x or v20.x installed.
- **Browser:** Google Chrome (v89+) or Microsoft Edge (v89+) with Web Serial API support.
- **Arduino IDE:** (Optional, only required if uploading firmware to physical hardware).

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173/` in Google Chrome or Microsoft Edge.

### Step 3: Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🧪 Automated Testing

The project includes 7 automated test suites validating 369 assertions with a **100% pass rate**:

```bash
# Run all automated test suites
node scripts/test_phase7_final_integration.js
node scripts/test_phase6_energy_analytics.js
node scripts/test_phase5_occupancy_analytics.js
node scripts/test_bugfix_occupancy_heartbeat.js
node scripts/test_phase4_ai_integration.js
node scripts/test_phase4_scenarios.js
node scripts/test_ldr_sync.js
```

---

## 🖼️ Application Screenshots

| Overview Dashboard | Edge AI Occupancy Detection |
|:---:|:---:|
| ![Overview Dashboard](docs/screenshots/overview.png) | ![Occupancy Monitoring](docs/screenshots/occupancy.png) |

| Smart Lighting Control | Energy Analytics & Reporting |
|:---:|:---:|
| ![Smart Lighting](docs/screenshots/smart_lighting.png) | ![Energy Analytics](docs/screenshots/energy_analytics.png) |

---

## 📚 Project Documentation Links

- [System Architecture & Workflow (`docs/PROJECT_ARCHITECTURE.md`)](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/docs/PROJECT_ARCHITECTURE.md)
- [Hardware Setup & Wiring Guide (`docs/HARDWARE_SETUP.md`)](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/docs/HARDWARE_SETUP.md)
- [Testing & Quality Assurance Report (`docs/TESTING_AND_VALIDATION.md`)](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/docs/TESTING_AND_VALIDATION.md)
- [Phase 6 Energy Analytics Specification (`docs/PHASE6_ENERGY_ANALYTICS.md`)](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/docs/PHASE6_ENERGY_ANALYTICS.md)
- [Phase 7 Engineering Consolidation Report (`docs/PHASE7_FINAL_REPORT.md`)](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/docs/PHASE7_FINAL_REPORT.md)
- [Faculty Demonstration Guide & Q&A (`docs/FINAL_PROJECT_DEMO_GUIDE.md`)](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/docs/FINAL_PROJECT_DEMO_GUIDE.md)

---

## 📄 Academic Project Attribution

**Smart Building Energy Waste Detection & Sustainability Monitoring System**  
Developed for academic presentation, peer review, and demonstration of edge cyber-physical sustainability engineering.
