// Main application routing
// URL format: /emergency/PT0002

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EmergencyProfile from "./EmergencyProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/emergency/:patientId" element={<EmergencyProfile />} />
      </Routes>
    </Router>
  );
}

export default App;