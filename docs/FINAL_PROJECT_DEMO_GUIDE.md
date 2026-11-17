# Faculty Project Demonstration Guide & Presentation Script

## Smart Building Energy Waste Detection & Sustainability Monitoring System

**Demonstration Duration:** 5–7 Minutes  
**Audience:** Faculty Evaluators / Academic Review Panel  
**Primary Presenter Goal:** Deliver a clear, evidence-based walkthrough demonstrating how the integration of edge computer vision, physical IoT sensing, and mathematical energy analytics eliminates unnecessary commercial building power waste.

---

## 1. Quick Setup & Preparation Checklist (2 Minutes Prior)

1. **Hardware Connection:**
   - Plug the Arduino Uno R3 into your laptop via USB.
   - Confirm Arduino IDE Serial Monitor is **closed**.
2. **Launch Application:**
   ```bash
   npm run dev
   ```
3. **Browser Setup:**
   - Open Google Chrome at `http://localhost:5173/`.
   - Maximize the browser window for optimal dashboard presentation.
4. **Hardware Handshake:**
   - Click **Hardware Mode** in the top navigation bar.
   - Click **Connect Arduino** and select the Arduino Uno COM port.
   - Verify green connection badge in the header.
5. **Camera Initialization:**
   - Navigate to **Occupancy Monitoring** in the sidebar.
   - Click **Start AI Camera** and grant browser webcam permissions.

---

## 2. 5–7 Minute Step-by-Step Demonstration Sequence

### Step 1: The Commercial Building Problem (0:00 – 0:45)
- **What to Say:**
  > "Good morning, respected evaluators. In modern commercial and university buildings, artificial lighting accounts for over 25% of total electricity consumption. Studies indicate that up to 35% of this lighting energy is completely wasted due to two major inefficiencies: luminaires burning in vacant rooms, and artificial lighting remaining on during peak solar daylight hours when natural daylight is more than sufficient.
  > 
  > Our project, the **Smart Building Energy Waste Detection & Sustainability Monitoring System**, solves this using a cyber-physical architecture combining edge AI computer vision, physical Arduino IoT telemetry, and mathematical energy analytics to eliminate this waste in real time."

---

### Step 2: Dashboard Overview & UI Tour (0:45 – 1:30)
- **What to Do:**
  - Navigate to the **Overview Dashboard** (`/overview`).
- **What to Say:**
  > "Here is our centralized Overview Dashboard built with React, Vite, and Tailwind CSS using a dark theme with emerald accents.
  > 
  > Across the top, we monitor our four primary parameters:
  > 1. Ambient natural light intensity from an LDR photoresistor on Analog Pin A0.
  > 2. Temperature and relative humidity from a DHT11 sensor on Pin D2.
  > 3. AI-inferred human occupancy via the laptop's built-in webcam.
  > 4. Physical room luminaire status confirmed directly from Arduino Digital Pin D7.
  > 
  > The dashboard operates in two completely isolated modes: **Demo Mode** for simulation and presentation, and **Hardware Mode** which interfaces directly with our physical breadboard controller."

---

### Step 3: Edge AI Human Presence Detection (1:30 – 2:30)
- **What to Do:**
  - Navigate to **Occupancy Monitoring** (`/occupancy`).
  - Show the live webcam view with bounding box on yourself.
  - Step out of the camera view for 5–10 seconds to show the 30-second absence grace countdown.
  - Step back into the camera view to show the countdown being cancelled.
- **What to Say:**
  > "Unlike traditional PIR motion sensors which suffer from blind spots and false-vacancies whenever an occupant sits still, our system uses local edge AI via **TensorFlow.js and COCO-SSD**.
  > 
  > All image inference occurs 100% client-side in the browser—zero video frames or images are ever stored or uploaded, preserving occupant privacy.
  > 
  > When I am in frame, the system detects a person with high confidence and confirms the state as **OCCUPIED**.
  > 
  > If I step out of the frame, notice that the lights do not abruptly turn off. The system initiates an intelligent **30-second absence grace period** with a visual countdown timer.
  > 
  > If I return before the 30 seconds expire, the system immediately cancels the countdown and maintains occupancy without jarring light flickering."

---

### Step 4: Daylight Sensing & Smart Lighting Decision Matrix (2:30 – 3:30)
- **What to Do:**
  - Navigate to **Smart Lighting** (`/smart-lighting`).
  - Demonstrate Rule 1: Cover the LDR sensor with your hand or cardboard ($< 500$ ADC) while present. Show that the Arduino Pin D7 Room LED turns **ON**.
  - Demonstrate Rule 2: Uncover the LDR sensor and expose it to room light or phone flashlight ($\ge 500$ ADC). Show that the Arduino Pin D7 Room LED turns **OFF** (Daylight Harvesting).
- **What to Say:**
  > "Here in the Smart Lighting section, our decision engine continuously evaluates the environmental truth table.
  > 
  > Notice Rule 1: When a person is present and ambient daylight is dim—below our calibrated 500 ADC threshold—the browser dispatches a `LIGHT_ON` command over Web Serial, and the physical LED on Arduino Pin D7 illuminates to satisfy task lighting requirements.
  > 
  > Now, if I expose the LDR to adequate daylight—above 500 ADC—Rule 2 activates: **Daylight Harvesting**. The browser dispatches `LIGHT_OFF`, de-energizing Pin D7 because free natural solar daylight satisfies room illumination."

---

### Step 5: Safety Watchdog & Failsafe Resilience (3:30 – 4:15)
- **What to Say:**
  > "Safety and industrial reliability were core engineering requirements.
  > 
  > 1. The browser dispatches a `{"command":"HEARTBEAT"}` packet every 2 seconds.
  > 2. The Arduino firmware features an autonomous 10-second communication watchdog. If the browser crashes, the laptop goes to sleep, or the USB cable is unplugged, the Arduino automatically turns Pin D7 OFF after 10 seconds of silence to prevent unattended electrical drain.
  > 3. If the webcam is covered or disconnected, the system safely transitions to **UNKNOWN** and withholds any automatic lighting activation."

---

### Step 6: Energy Analytics & Cost Savings Estimation (4:15 – 5:15)
- **What to Do:**
  - Navigate to **Energy Analytics** (`/energy-analytics`).
  - Point to the 5 executive KPI cards (Energy Consumed, Electricity Cost, Operating Hours, Avoidable Waste, and Estimated Savings).
  - Show the 24-hour daily hourly bar chart.
- **What to Say:**
  > "Phase 6 introduces our centralized Energy Analytics platform.
  > 
  > The system tracks exact second-by-second operating intervals of the physical Pin D7 LED. Using the configured **9 W LED power rating** and standard commercial electricity tariff of **₹8.00 per kWh**:
  > - 1 hour of LED runtime consumed is calculated as $(9\text{ W} \times 1\text{ h}) / 1000 = 0.009\text{ kWh}$, costing ₹0.072.
  > 
  > By cross-referencing lighting intervals with our AI occupancy sessions, the system distinguishes between useful task lighting and **avoidable waste**—such as lighting left on in an empty room or during bright sunlight.
  > 
  > Compared against a standard commercial baseline of 10 working hours of continuous illumination, our intelligent automation demonstrates an estimated **85% to 92% energy efficiency**, saving valuable kilowatt-hours."

---

### Step 7: Sustainability Audit Reporting & Conclusion (5:15 – 6:00)
- **What to Do:**
  - Scroll to the bottom of `/energy-analytics`.
  - Click **Download PDF Report** to trigger the formatted print-to-PDF report preview.
  - Click **Export CSV Dataset** to download the raw interval spreadsheet.
- **What to Say:**
  > "Finally, for building managers and energy auditors, the system generates downloadable compliance reports.
  > 
  > Clicking **Download PDF Report** produces an executive sustainability audit detailing consumption, avoidable waste, occupancy correlation, and smart recommendations.
  > 
  > In conclusion, our system proves that combining affordable microcontrollers, browser-native Web Serial communication, and client-side computer vision delivers an intelligent, privacy-compliant, and cost-effective commercial energy conservation platform. Thank you, and we welcome your questions."

---

## 3. Likely Faculty Questions & Technically Accurate Answers

### Q1: "Are you measuring actual electrical current or power using a physical sensor?"
**Answer:**
> "No, sir/madam. We explicitly disclose on the dashboard and in our technical documentation that our system does not use a physical current transducer like an ACS712 or CT sensor.
> 
> Instead, our energy figures are **mathematically calculated estimates** derived from confirmed physical hardware runtime intervals on Arduino Pin D7 and the configured nominal wattage rating of 9 W ($E = P \times t / 1000$) at a tariff of ₹8.00/kWh. This allows accurate operational energy modeling without the cost and high-voltage hazards of installing physical power meters on individual demonstration circuits."

---

### Q2: "Why did you replace the PIR motion sensor with webcam AI?"
**Answer:**
> "Standard PIR motion sensors detect changes in infrared radiation caused by movement across Fresnel lens zones. If a student or office worker sits quietly at their desk reading or typing without waving their arms, a PIR sensor registers zero motion and falsely declares the space vacant, plunging the room into darkness.
> 
> By utilizing client-side TensorFlow.js with the COCO-SSD convolutional model, our system performs continuous object detection specifically for the 'person' class. It accurately identifies human presence even when stationary, virtually eliminating false-vacancy errors."

---

### Q3: "Does the webcam stream compromise user privacy or require internet bandwidth?"
**Answer:**
> "Not at all. The computer vision model runs 100% locally on the client laptop's browser using WebGL/WASM acceleration. No video frames, images, or facial biometrics are ever uploaded to a cloud server, saved to disk, or transmitted over the network. The output of the AI pipeline is simply an integer count of detected persons."

---

### Q4: "What happens if the serial connection or browser crashes while the lights are on?"
**Answer:**
> "We implemented a dual safety mechanism:
> 1. The web application dispatches a heartbeat command every 2 seconds.
> 2. The Arduino firmware maintains an autonomous 10-second communication watchdog. If communication drops or the laptop closes while the room LED is energized in automatic mode, the Arduino detects the absence of heartbeats and automatically pulls Pin D7 LOW within 10 seconds, ensuring that lights cannot remain energized indefinitely."

---

### Q5: "How are Demo Mode and Hardware Mode kept separate?"
**Answer:**
> "We maintain completely independent storage partitions in the browser's localStorage (`_hw_v1` vs `_demo_v1`). When in Hardware Mode, all charts and analytics derive strictly from live Web Serial packets and confirmed hardware state transitions. When in Demo Mode, synthetic simulation models allow demonstration of scenarios—such as high noon daylight or vacant room waste—without requiring physical hardware attached, with zero data contamination between the two environments."
