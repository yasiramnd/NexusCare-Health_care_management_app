import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DoctorLoginPage from "./pages/DoctorLoginPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import ScanPage from "./pages/ScanPage";
import PatientPage from "./pages/PatientPage";
import DoctorProtectedRoute from "./components/DoctorProtectedRoute";
import DoctorRegisterPage from "./pages/DoctorRegisterPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/doctor/login" replace />} />

        {/* Public route */}
        <Route path="/doctor/login" element={<DoctorLoginPage />} />

        <Route path="/doctor/register" element={<DoctorRegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <DoctorProtectedRoute>
              <DoctorDashboard />
            </DoctorProtectedRoute>
          }
        />

        <Route
          path="/doctor/scan"
          element={
            <DoctorProtectedRoute>
              <ScanPage />
            </DoctorProtectedRoute>
          }
        />

        <Route
          path="/doctor/patient/:id"
          element={
            <DoctorProtectedRoute>
              <PatientPage />
            </DoctorProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);