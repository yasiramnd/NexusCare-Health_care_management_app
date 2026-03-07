import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DoctorLoginPage from "./pages/DoctorLoginPage";
import DoctorRegisterPage from "./pages/DoctorRegisterPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientLookup from "./pages/PatientLookup";
import PatientPage from "./pages/PatientPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import ConsultationPage from "./pages/ConsultationPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import LabReportsPage from "./pages/LabReportsPage";
import DoctorProfilePage from "./pages/DoctorProfilePage";
import DoctorProtectedRoute from "./components/DoctorProtectedRoute";
import AvailabilityPage from "./pages/AvailabilityPage";

function Protected({ children }) {
  return <DoctorProtectedRoute>{children}</DoctorProtectedRoute>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/doctor/login" replace />} />

        {/* Public */}
        <Route path="/doctor/login" element={<DoctorLoginPage />} />
        <Route path="/doctor/register" element={<DoctorRegisterPage />} />

        {/* Protected Portal */}
        <Route path="/doctor/dashboard" element={<Protected><DoctorDashboard /></Protected>} />
        <Route path="/doctor/patients" element={<Protected><PatientLookup /></Protected>} />
        <Route path="/doctor/patient/:id" element={<Protected><PatientPage /></Protected>} />
        <Route path="/doctor/scan" element={<Protected><PatientLookup /></Protected>} />
        <Route path="/doctor/appointments" element={<Protected><AppointmentsPage /></Protected>} />
        <Route path="/doctor/consultation" element={<Protected><ConsultationPage /></Protected>} />
        <Route path="/doctor/prescriptions" element={<Protected><PrescriptionsPage /></Protected>} />
        <Route path="/doctor/labs" element={<Protected><LabReportsPage /></Protected>} />
        <Route path="/doctor/profile" element={<Protected><DoctorProfilePage /></Protected>} />
        <Route path="/doctor/availability" element={<Protected><AvailabilityPage /></Protected>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);