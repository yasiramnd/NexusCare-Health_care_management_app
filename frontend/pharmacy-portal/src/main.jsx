import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PharmacyLoginPage from "./pages/PharmacyLoginPage";
import PharmacyRegisterPage from "./pages/PharmacyRegisterPage";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import PharmacyProtectedRoute from "./components/PharmacyProtectedRoute";

function Protected({ children }) {
  return <PharmacyProtectedRoute>{children}</PharmacyProtectedRoute>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/pharmacy/login" replace />} />

        {/* Public */}
        <Route path="/pharmacy/login" element={<PharmacyLoginPage />} />
        <Route path="/pharmacy/register" element={<PharmacyRegisterPage />} />

        {/* Protected Portal */}
        <Route path="/pharmacy/dashboard" element={<Protected><PharmacyDashboard /></Protected>} />
        <Route path="/pharmacy/*" element={<Protected><PharmacyDashboard /></Protected>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
