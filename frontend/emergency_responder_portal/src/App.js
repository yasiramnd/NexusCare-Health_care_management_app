// Main application routing
// URL format: /emergency/PT0002

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import EmergencyProfile from "./EmergencyProfile";

function Landing() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7fb", padding: 24 }}>
      <div style={{ maxWidth: 680, width: "100%", background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 10px 24px rgba(0,0,0,0.08)" }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>NexusCare Emergency Responder Portal</h1>
        <p style={{ marginTop: 12, color: "#334155", lineHeight: 1.6 }}>
          Scan a patient QR code or open a patient link in this format:
          <br />
          <strong>/emergency/&lt;patient_id&gt;</strong>
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/emergency/:patientId" element={<EmergencyProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;