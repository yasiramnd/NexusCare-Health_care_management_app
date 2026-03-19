import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import RecommendedTests from "./pages/operations/RecommendedTests.jsx";
import TestRequests from "./pages/operations/TestRequests.jsx";
import UploadReport from "./pages/operations/UploadReport.jsx";
import ReportsHistory from "./pages/operations/ReportsHistory.jsx";
import PatientLabHistory from "./pages/operations/PatientLabHistory.jsx";
import PatientLookup from "./pages/operations/PatientLookup.jsx";
import OfferedTests from "./pages/management/OfferedTests.jsx";
import Availability from "./pages/settings/Availability.jsx";
import Performance from "./pages/settings/Performance.jsx";
import Profile from "./pages/account/Profile.jsx";

import AppLayout from "./components/AppLayout.jsx";
import Loading from "./components/Loading.jsx";

import { useAuth } from "./context/AuthContext.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();


  if (loading) return <Loading label="Loading..." />;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Layout */}
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<Dashboard />} />

          {/* Lab Operations */}
          <Route path="operations/patient-lookup" element={<PatientLookup />} />
          <Route path="operations/upload" element={<UploadReport />} />

          {/* Settings */}
          <Route path="settings/availability" element={<Availability />} />

          {/* Account */}
          <Route path="account/profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}