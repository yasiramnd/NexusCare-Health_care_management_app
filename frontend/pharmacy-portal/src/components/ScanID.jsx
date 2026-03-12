import { useState } from "react";
import { apiFetch } from "../api/client";
import "./ScanID.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const SearchIcon = ({ size = 18, color = "#94a3b8" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
    <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const QRIcon = ({ size = 22, color = "#059669" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
    <path d="M14 14h2v2h-2zM18 14h3M14 18h3M19 18v3M19 21h-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const CameraIcon = ({ size = 28, color = "#64748b" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="1.5" />
    <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.5" />
  </svg>
);
const CheckCircleIcon = ({ size = 32 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2" />
    <path d="M8 12l3 3 5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const UserIcon = ({ size = 18, color = "#059669" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const ClipboardIcon = ({ size = 18, color = "#6366f1" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke={color} strokeWidth="2" />
    <path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ArrowRightIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);



function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ScanID({ onBack, onViewPrescriptions }) {
  const [mode, setMode] = useState("idle"); // idle | scanning | found | notfound
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMethod, setSearchMethod] = useState(null); // "qr" | "search"
  const [patient, setPatient] = useState(null);

  const handleCapture = () => {
    setMode("scanning");
    setSearchMethod("qr");
    // QR camera integration placeholder — no real camera library available
    setTimeout(() => setMode("idle"), 1800);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setMode("scanning");
    setSearchMethod("search");
    try {
      const data = await apiFetch(`/api/pharmacy/patient/lookup?qr=${encodeURIComponent(searchQuery.trim())}`);
      setPatient({
        id: data.patient_id,
        name: data.name,
        phone: data.contact_no,
        address: data.address,
        gender: data.gender,
        dob: data.date_of_birth,
        bloodGroup: data.blood_group,
        allergies: data.allergies,
        chronicConditions: data.chronic_conditions,
        activePrescriptions: data.active_prescriptions,
        lastVisit: data.last_visit || "N/A",
      });
      setMode("found");
    } catch {
      setMode("notfound");
    }
  };

  const handleReset = () => {
    setMode("idle");
    setSearchQuery("");
    setSearchMethod(null);
  };

  const isFound = mode === "found";
  const isScanning = mode === "scanning";

  return (
    <div className="scan-page-v2">

      {/* ── PAGE HEADER ── */}
      <div className="scan-page-header">
        <div className="scan-page-header-left">
          <div className="scan-page-icon-wrap">
            <UserIcon size={22} color="#059669" />
          </div>
          <div>
            <h1 className="scan-page-title">Patient Lookup</h1>
            <p className="scan-page-desc">Search by Patient ID or scan QR code to access patient information</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR (always visible) ── */}
      <form className="scan-search-bar" onSubmit={handleSearch}>
        <div className="scan-search-input-wrap">
          <span className="scan-search-icon"><SearchIcon size={18} /></span>
          <input
            type="text"
            className="scan-search-input"
            placeholder="Enter Patient ID (e.g. PID-2891) or patient name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            disabled={isScanning}
          />
          <button
            type="submit"
            className="scan-search-btn"
            disabled={isScanning || !searchQuery.trim()}
          >
            <SearchIcon size={16} color="white" />
            Search
          </button>
        </div>
      </form>

      {/* ── TWO-PANEL CONTENT ── */}
      <div className="scan-panels">

        {/* LEFT: QR Scanner */}
        <div className="scan-panel scan-panel-qr">
          <div className="scan-panel-header">
            <QRIcon size={20} />
            <span className="scan-panel-label">QR Code Scanner</span>
          </div>

          <div className={`scan-viewer-v2 ${isScanning && searchMethod === "qr" ? "scanning" : ""}`}>
            <span className="corner-v2 tl" />
            <span className="corner-v2 tr" />
            <span className="corner-v2 bl" />
            <span className="corner-v2 br" />

            <div className="scan-viewer-center-v2">
              {isScanning && searchMethod === "qr" ? (
                <div className="scan-laser-v2" />
              ) : (
                <>
                  <CameraIcon size={36} color="#475569" />
                  <div className="scan-viewer-text">Position QR code in frame</div>
                  <div className="scan-viewer-sub">Camera will auto-detect the code</div>
                </>
              )}
            </div>
          </div>

          <button
            className={`scan-capture-btn-v2 ${isScanning ? "disabled" : ""}`}
            onClick={handleCapture}
            disabled={isScanning}
          >
            <QRIcon size={18} color="white" />
            {isScanning && searchMethod === "qr" ? "Scanning..." : "Scan QR Code"}
          </button>
        </div>

        {/* RIGHT: Result / Instructions */}
        <div className="scan-panel scan-panel-result">
          {isFound ? (
            <>
              {/* Success header */}
              <div className="scan-found-header">
                <div className="scan-found-icon-wrap">
                  <CheckCircleIcon size={28} />
                </div>
                <div>
                  <div className="scan-found-title">Patient Found</div>
                  <div className="scan-found-method">
                    {searchMethod === "qr" ? "Via QR Scan" : `Searched: "${searchQuery}"`}
                  </div>
                </div>
              </div>

              {/* Patient card */}
              {patient && (
              <div className="scan-patient-card">
                <div className="scan-patient-top">
                  <div className="scan-patient-avatar">{getInitials(patient.name)}</div>
                  <div className="scan-patient-name-wrap">
                    <div className="scan-patient-name">{patient.name}</div>
                    <div className="scan-patient-id-badge">{patient.id}</div>
                  </div>
                </div>

                <div className="scan-patient-details">
                  <div className="scan-detail-row">
                    <span className="scan-detail-label">Date of Birth</span>
                    <span className="scan-detail-value">{patient.dob}</span>
                  </div>
                  <div className="scan-detail-row">
                    <span className="scan-detail-label">Gender</span>
                    <span className="scan-detail-value">{patient.gender}</span>
                  </div>
                  <div className="scan-detail-row">
                    <span className="scan-detail-label">Phone</span>
                    <span className="scan-detail-value">{patient.phone}</span>
                  </div>
                  <div className="scan-detail-row">
                    <span className="scan-detail-label">Last Visit</span>
                    <span className="scan-detail-value">{patient.lastVisit}</span>
                  </div>
                  <div className="scan-detail-row">
                    <span className="scan-detail-label">Active Prescriptions</span>
                    <span className="scan-detail-value scan-detail-highlight">{patient.activePrescriptions}</span>
                  </div>
                </div>
              </div>
              )}

              {/* Action buttons */}
              <div className="scan-actions">
                <button className="scan-action-primary" onClick={() => onViewPrescriptions(patient.id)}>
                  <ClipboardIcon size={18} color="white" />
                  View Prescriptions
                  <ArrowRightIcon size={16} color="white" />
                </button>
                <button className="scan-action-secondary" onClick={handleReset}>
                  New Search
                </button>
              </div>
            </>
          ) : mode === "notfound" ? (
            <div className="scan-empty-state">
              <div className="scan-empty-icon">
                <SearchIcon size={32} color="#cbd5e1" />
              </div>
              <div className="scan-empty-title">No Patient Found</div>
              <div className="scan-empty-desc">
                No records match "<strong>{searchQuery}</strong>". Please check the ID and try again.
              </div>
              <button className="scan-action-secondary" onClick={handleReset}>
                Try Again
              </button>
            </div>
          ) : isScanning && searchMethod === "search" ? (
            <div className="scan-empty-state">
              <div className="scan-loading-spinner" />
              <div className="scan-empty-title">Searching...</div>
              <div className="scan-empty-desc">Looking up patient records</div>
            </div>
          ) : (
            /* Idle instructions */
            <div className="scan-empty-state">
              <div className="scan-empty-icon">
                <UserIcon size={36} color="#cbd5e1" />
              </div>
              <div className="scan-empty-title">Find a Patient</div>
              <div className="scan-empty-desc">
                Use the search bar above to look up a patient by their ID or name, or scan a QR code on the left to get started.
              </div>
              <div className="scan-tips">
                <div className="scan-tip">
                  <span className="scan-tip-num">1</span>
                  <span>Enter Patient ID (e.g. <strong>PID-2891</strong>) in the search bar</span>
                </div>
                <div className="scan-tip">
                  <span className="scan-tip-num">2</span>
                  <span>Or scan the patient's QR code using the scanner</span>
                </div>
                <div className="scan-tip">
                  <span className="scan-tip-num">3</span>
                  <span>View and manage prescriptions instantly</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
