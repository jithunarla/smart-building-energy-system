# Phase 6: Advanced Energy Analytics, Savings Estimation & Sustainability Reporting

## Smart Building Energy Waste Detection & Sustainability Monitoring System

This document provides technical documentation, mathematical models, operational methodologies, and architecture specifications for Phase 6 of the academic project.

---

## 1. Energy Calculation Methodology & Mathematical Formulas

The system implements a centralized mathematical calculation engine ([src/services/energyAnalyticsService.js](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/src/services/energyAnalyticsService.js)) to quantify electrical energy consumption and electricity costs.

### A. Basic Energy Consumption Formula
$$\text{Energy (kWh)} = \frac{\text{Power (Watts)} \times \text{Operating Time (Hours)}}{1000}$$

With the initial rated configuration of the **9 W Room LED** connected to **Arduino Pin D7**:
- **1 hour of continuous illumination:**
  $$\text{Energy} = \frac{9 \times 1}{1000} = 0.009 \text{ kWh}$$
- **10 hours of continuous illumination:**
  $$\text{Energy} = \frac{9 \times 10}{1000} = 0.090 \text{ kWh}$$
- **100 hours of continuous illumination:**
  $$\text{Energy} = \frac{9 \times 100}{1000} = 0.900 \text{ kWh}$$

### B. Electricity Cost Calculation Formula
$$\text{Cost (₹)} = \text{Energy (kWh)} \times \text{Tariff (₹/kWh)}$$

At the standard commercial electricity tariff of **₹8.00 per kWh**:
- **1 hour of 9 W LED operation:**
  $$\text{Cost} = 0.009 \text{ kWh} \times 8.00 = ₹0.072$$
- **10 hours of 9 W LED operation:**
  $$\text{Cost} = 0.090 \text{ kWh} \times 8.00 = ₹0.720$$
- **100 hours of 9 W LED operation:**
  $$\text{Cost} = 0.900 \text{ kWh} \times 8.00 = ₹7.200$$

All calculations are evaluated at full floating-point precision internally and rounded only for display.

---

## 2. Default Configuration & Centralized Management

The energy settings are centralized in [src/config/energyConfig.js](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/src/config/energyConfig.js):

| Parameter | Default Value | Unit | Description |
|---|---|---|---|
| **Room LED Power Rating** | `9` | Watts (W) | Nominal wattage rating of the physical luminaire connected to Pin D7 |
| **Electricity Tariff** | `8.00` | INR (₹) / kWh | Commercial / institutional electricity tariff rate |
| **Currency** | `INR (₹)` | Text / Symbol | Indian Rupee |
| **Energy Unit** | `kWh` | Text | Kilowatt-hour |
| **Target Hardware Output** | `D7` | Arduino Pin | Digital output controlling the physical room luminaire |
| **Daylight Harvesting Cutoff** | `500` | ADC (0–1023) | Light intensity threshold: $\ge 500$ ADC indicates sufficient solar daylight |
| **Occupancy Absence Timeout** | `30` | Seconds | Grace period before declared vacant |
| **Baseline Office Hours** | `10` | Hours / Day | Theoretical unmanaged office illumination schedule |

### Editable Energy Settings
Users can customize the power rating and tariff via the **Energy Configuration** panel on the **Energy Analytics** dashboard. Updates are persisted in local browser storage (`eco_bms_energy_config_v1`) and dynamically trigger real-time recalculation across all active dashboard charts and summary metrics.

---

## 3. Actual vs. Estimated Energy Data (Transparency & Measurement Limits)

> [!IMPORTANT]
> **Measurement Limits Disclosure:**  
> The physical IoT hardware assembly utilizes an **Arduino Uno R3**, an **LDR photoresistor (A0)**, a **DHT11 temperature/humidity sensor (D2)**, an **HC-SR501 PIR sensor**, and a **Room LED on Pin D7**. The system **does not include an electrical power meter or current sensor** (such as an ACS712 or CT coil).  
> Therefore, all electrical power, kilowatt-hour, and financial cost figures are **mathematically calculated estimates** derived from confirmed physical operating runtimes and configured device wattage. The application never claims direct electrical power measurement.

---

## 4. Lighting Usage History & Interval Tracking

The [src/services/lightingHistoryService.js](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/src/services/lightingHistoryService.js) module provides second-level operational interval tracking:

1. **State Transition Recording:** Every genuine ON/OFF transition is captured with operational context:
   ```json
   {
     "id": "light-evt-1763428900-a1b2c3",
     "timestamp": "2026-11-18T08:30:00.000Z",
     "previousState": "OFF",
     "currentState": "ON",
     "actualHardwareConfirmed": 1,
     "desiredState": 1,
     "occupancy": "OCCUPIED",
     "ldr": 240,
     "daylight": false,
     "mode": "HARDWARE",
     "reason": "Person present and ambient daylight is insufficient (240 ADC < 500 ADC)"
   }
   ```
2. **Interval Lifecycle:**
   - When the LED switches `ON`, a new interval record is created with `endTime: null` (open/ongoing).
   - When the LED switches `OFF`, the open interval is sealed, computing `durationSeconds = (endTime - startTime) / 1000`.
   - Ongoing active intervals calculate elapsed runtime in real-time up to `Date.now()`.
3. **Duplicate Suppression:** Consecutive duplicate state telemetry (e.g. repeated `ON` reports during normal streaming) is filtered without creating redundant intervals.
4. **Boundary Clamping:** The service cleanly splits multi-day intervals across local calendar day boundaries (`00:00:00.000` to `23:59:59.999`) and midnight crossings.

---

## 5. Intelligent Energy Waste Scenarios

The [src/services/energyWasteAnalyticsService.js](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/src/services/energyWasteAnalyticsService.js) continuously monitors combinations of human presence, natural daylight, and luminaire status:

| Scenario | Conditions | Classification | Action / Output |
|---|---|---|---|
| **1. Vacant Space Lighting** | Occupancy = `UNOCCUPIED` & Room LED = `ON` | `VACANCY_LIGHT_WASTE` (Critical) | Flags avoidable runtime; calculates wasted kWh and cost at 9 W load. |
| **2. Daylight Harvesting Inefficiency** | Occupancy = `OCCUPIED` & LDR $\ge 500$ ADC & Room LED = `ON` | `DAYLIGHT_HARVEST_WASTE` (Warning) | Flags solar harvesting failure; quantifies avoidable runtime and cost. |
| **3. Task Illuminance Deficit** | Occupancy = `OCCUPIED` & LDR $< 500$ ADC & Room LED = `OFF` | `ILLUMINANCE_DEFICIT_WARNING` (Advisory) | Generates comfort/ergonomic warning. **Explicitly categorized as zero energy waste and zero savings.** |
| **4. Efficient Operation** | Vacant & OFF, or Occupied & Bright & OFF, or Occupied & Dim & ON | `EFFICIENT_OPERATION` (Optimal) | Verifies optimal sensor-actuator alignment. |
| **5. Sensor Outage / Stale Data** | Occupancy = `UNKNOWN` or LDR sensor missing | `INCOMPLETE_ANALYSIS` (Diagnostic) | Suspends waste calculations; displays missing sensor diagnostic warning. |

---

## 6. Occupancy vs. Lighting Correlation Analysis

To provide insights into building operations, the analytics engine correlates occupancy session intervals from [occupancyEventService.js](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/src/services/occupancyEventService.js) with lighting intervals:

$$\text{Window Duration} = \text{Total Elapsed Time}$$
$$\text{Window Duration} = \text{Occupied Duration} + \text{Unoccupied Duration}$$

The lighting runtime is divided into three distinct buckets:
1. **Task Illuminance Duration ($t_{\text{task}}$):** Room is `OCCUPIED` and ambient daylight is dim ($< 500$ ADC). Luminaire operation is necessary and justified.
2. **Vacant Drain ($t_{\text{vacant}}$):** Room is `UNOCCUPIED` while LED is `ON`. Pure avoidable waste.
3. **Daylight Overload ($t_{\text{daylight}}$):** Room is `OCCUPIED` but solar daylight is adequate ($\ge 500$ ADC). Unnecessary artificial illumination.

$$\text{Avoidable Hours} = t_{\text{vacant}} + \alpha \cdot t_{\text{daylight}}$$
$$\text{Lighting Efficiency \%} = \max\left(0, \min\left(100, 100 \times \left(1 - \frac{\text{Avoidable Hours}}{\text{Total LED ON Hours}}\right)\right)\right)$$

---

## 7. Baseline Energy Savings Model

The application compares intelligent automated lighting against a theoretical unmanaged commercial baseline:
- **Baseline Scenario:** Fixed commercial office schedule of 10 working hours per day (8:00 AM – 6:00 PM) with continuous luminaire illumination.
- **Baseline Energy (kWh):**
  $$\text{Baseline Energy} = \frac{9 \text{ W} \times (10 \text{ hours} \times \text{Days})}{1000}$$
- **Estimated Savings:**
  $$\text{Energy Saved (kWh)} = \max(0, \text{Baseline Energy} - \text{Actual Energy Consumed})$$
  $$\text{Cost Saved (₹)} = \text{Energy Saved} \times ₹8.00/\text{kWh}$$

> [!NOTE]
> The baseline scenario is explicitly documented on the dashboard and in generated reports as a **theoretical comparison scenario** with declared assumptions, not an empirical historical baseline.

---

## 8. Downloadable Sustainability & Audit Reports

The [src/services/sustainabilityReportService.js](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/src/services/sustainabilityReportService.js) exports documentation in two formats:

1. **Executive PDF Report:**
   - Formatted HTML document with `@media print` styling triggering the browser's native print-to-PDF dialog.
   - Includes: Project header, generation timestamp, telemetry mode, energy configuration, executive summary cards, occupancy correlation matrix, waste events audit table, evidence-based recommendations, and data limitation disclosures.
2. **CSV Data Export:**
   - Raw data export for external spreadsheet auditing.
   - Includes metadata, summary metrics, occupancy-lighting correlation, full lighting interval logs (with start/end times, durations, and LDR readings), and waste events with severity classifications.

---

## 9. Local Storage & Mode Separation

The system maintains strict isolation between **Hardware Mode** and **Demo Mode**:

| Storage Key | Mode | Purpose |
|---|---|---|
| `eco_bms_energy_config_v1` | Global | Rated LED wattage, tariff, and currency preferences |
| `eco_bms_lighting_events_hw_v1` | Hardware | Arduino Pin D7 actual transition events |
| `eco_bms_lighting_intervals_hw_v1` | Hardware | Hardware operating interval records |
| `eco_bms_waste_events_hw_v1` | Hardware | Energy waste events identified from physical hardware telemetry |
| `eco_bms_lighting_events_demo_v1` | Demo | Simulated transition events |
| `eco_bms_lighting_intervals_demo_v1` | Demo | Simulated commercial workday lighting intervals |
| `eco_bms_waste_events_demo_v1` | Demo | Simulated waste events |

**Privacy Guarantee:** Zero images, video streams, or facial biometric data are stored locally or transmitted externally.

---

## 10. Automated Test Coverage

The Phase 6 automated test suite ([scripts/test_phase6_energy_analytics.js](file:///c:/Users/jitu-vamsi/Downloads/Mukilan%20Project/scripts/test_phase6_energy_analytics.js)) executes 88 test assertions:
- **Section 1:** Mathematical energy calculations (9 W $\times$ 1h/10h/100h, ₹8 tariff, wattage updates, tariff adjustments).
- **Section 2:** Lighting interval lifecycle (OFF$\rightarrow$ON, ON$\rightarrow$OFF, duplicate suppression, ongoing intervals, midnight splitting).
- **Section 3:** Energy waste scenarios (vacancy drain, daylight harvesting, task illuminance warnings, sensor outage safety).
- **Section 4:** Period analytics (24h daily, 7d weekly, monthly, and custom range).
- **Section 5:** Report generation (PDF data assembly and CSV formatting).
- **Section 6:** System and hardware regressions (Pin D7 control, LDR A0, DHT11, 2s heartbeat, 30s absence timeout).
