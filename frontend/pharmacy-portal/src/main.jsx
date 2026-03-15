import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import PharmacyLoginPage from "./pages/PharmacyLoginPage";
import PharmacyRegisterPage from "./pages/PharmacyRegisterPage";
import PharmacyLayout from "./pages/PharmacyLayout";
import DashboardHome from "./pages/DashboardHome";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import InventoryPage from "./pages/InventoryPage";
import PriorityOrdersPage from "./pages/PriorityOrdersPage";
import NormalOrdersPage from "./pages/NormalOrdersPage";
import ScanIDPage from "./pages/ScanIDPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import PharmacyProfilePage from "./pages/PharmacyProfilePage";
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

        {/* Protected Portal — nested under layout */}
        <Route path="/pharmacy" element={<Protected><PharmacyLayout /></Protected>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="priority-orders" element={<PriorityOrdersPage />} />
          <Route path="normal-orders" element={<NormalOrdersPage />} />
          <Route path="scan-id" element={<ScanIDPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="profile" element={<PharmacyProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
