import { useState } from "react";
import "./ScanID.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const HomeIcon = ({ active }) => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <path d="M3 12L12 3l9 9" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10v11h14V10" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 21V13h6v8" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PillIcon = ({ color = "#9ca3af" }) => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke={color} strokeWidth="2"/>
    <path d="M12 8.5v7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const BoxIcon = ({ color = "#9ca3af" }) => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="2"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="22.08" x2="12" y2="12" stroke={color} strokeWidth="2"/>
  </svg>
);
const UserIcon = ({ active }) => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const CameraIcon = () => (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#9ca3af" strokeWidth="1.5"/>
    <circle cx="12" cy="13" r="4" stroke="#9ca3af" strokeWidth="1.5"/>
  </svg>
);
const QRFrameIcon = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
    <path d="M14 14h2v2h-2zM18 14h3M14 18h3M19 18v3M19 21h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/>
    <path d="M8 12l3 3 5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CaptureIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="white" strokeWidth="2"/>
    <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
  </svg>
);

// ── Fake patient result ────────────────────────────────────────────────────
const fakePatient = {
  name: "Sarah Johnson",
  id: "PID-2891",
  dob: "March 15, 1985",
};

const navItems = [
  { label: "Home",          icon: (a) => <HomeIcon active={a} /> },
  { label: "Prescriptions", icon: (a) => <PillIcon color={a ? "#2dd4bf" : "#9ca3af"} /> },
  { label: "Inventory",     icon: (a) => <BoxIcon  color={a ? "#2dd4bf" : "#9ca3af"} /> },
  { label: "Profile",       icon: (a) => <UserIcon active={a} /> },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function ScanID({ onBack, onViewPrescriptions }) {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeNav, setActiveNav] = useState("Home");

  const handleCapture = () => {
    setScanning(true);
    // Simulate scan delay
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 1800);
  };

  const handleReset = () => {
    setScanned(false);
    setScanning(false);
  };

  return (
    <div className="scan-page">

      {/* HEADER */}
      <div className="scan-header">
        <button className="scan-back-btn" onClick={onBack}>
          <BackIcon />
        </button>
        <h1 className="scan-title">Scan QR</h1>
      </div>

      {/* SUBTITLE */}
      <p className="scan-subtitle">
        Scan patient's QR code to quickly access their prescription history and information.
      </p>

      {/* CONTENT AREA */}
      <div className="scan-content">

        {/* ── SCANNER VIEW ── */}
        {!scanned && (
          <div className="scan-viewer-wrap">
            <div className={`scan-viewer ${scanning ? "scanning" : ""}`}>

              {/* Corner brackets */}
              <span className="corner tl" />
              <span className="corner tr" />
              <span className="corner bl" />
              <span className="corner br" />

              {/* Center content */}
              <div className="scan-viewer-center">
                {scanning ? (
                  <div className="scan-laser" />
                ) : (
                  <>
                    <div className="scan-camera-icon"><CameraIcon /></div>
                    <div className="scan-viewer-label">Camera view</div>
                  </>
                )}
              </div>

              {/* Bottom hint */}
              <div className="scan-hint">
                <QRFrameIcon />
                <div>
                  <div className="scan-hint-title">
                    {scanning ? "Scanning..." : "Position QR code within frame"}
                  </div>
                  {!scanning && (
                    <div className="scan-hint-sub">Hold steady for automatic scan</div>
                  )}
                </div>
              </div>

            </div>

            {/* CAPTURE BUTTON */}
            <button
              className={`scan-capture-btn ${scanning ? "disabled" : ""}`}
              onClick={handleCapture}
              disabled={scanning}
            >
              <CaptureIcon />
              {scanning ? "Scanning..." : "Capture Image"}
            </button>
          </div>
        )}

        {/* ── SCANNED RESULT ── */}
        {scanned && (
          <div className="scan-result-card">
            {/* Success icon */}
            <div className="scan-success-icon">
              <CheckIcon />
            </div>
            <h2 className="scan-success-title">QR Scanned Successfully!</h2>
            <p className="scan-success-sub">
              Patient information has been retrieved.<br />
              Loading prescription details...
            </p>

            {/* Patient info */}
            <div className="scan-patient-info">
              <div className="scan-patient-row">
                <span className="scan-patient-field">Patient Name</span>
                <span className="scan-patient-value">{fakePatient.name}</span>
              </div>
              <div className="scan-divider" />
              <div className="scan-patient-row">
                <span className="scan-patient-field">Patient ID</span>
                <span className="scan-patient-value">{fakePatient.id}</span>
              </div>
              <div className="scan-divider" />
              <div className="scan-patient-row">
                <span className="scan-patient-field">Date of Birth</span>
                <span className="scan-patient-value">{fakePatient.dob}</span>
              </div>
            </div>

            {/* Action buttons */}
            <button
              className="scan-view-btn"
              onClick={onViewPrescriptions}
            >
              View Prescriptions
            </button>
            <button className="scan-rescan-btn" onClick={handleReset}>
              Scan Again
            </button>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <nav className="scan-bottom-nav">
        {navItems.map(item => {
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              className="scan-nav-item"
              onClick={() => setActiveNav(item.label)}
            >
              {item.icon(isActive)}
              <span className="scan-nav-label" style={{ color: isActive ? "#2dd4bf" : "#9ca3af" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
