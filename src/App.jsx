import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SensorProvider } from './context/SensorContext';
import { DashboardProvider } from './context/DashboardContext';
import DashboardLayout from './layouts/DashboardLayout';

// Dashboard Pages
import Overview from './pages/Overview';
import SensorMonitoring from './pages/SensorMonitoring';
import Occupancy from './pages/Occupancy';
import SmartLighting from './pages/SmartLighting';
import Alerts from './pages/Alerts';
import Recommendations from './pages/Recommendations';
import EnergyAnalytics from './pages/EnergyAnalytics';
import Sustainability from './pages/Sustainability';

function App() {
  return (
    <SensorProvider>
      <DashboardProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="sensor-monitoring" element={<SensorMonitoring />} />
              <Route path="occupancy" element={<Occupancy />} />
              <Route path="smart-lighting" element={<SmartLighting />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="energy-analytics" element={<EnergyAnalytics />} />
              <Route path="sustainability" element={<Sustainability />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DashboardProvider>
    </SensorProvider>
  );
}

export default App;
