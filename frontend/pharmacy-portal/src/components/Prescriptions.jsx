import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import "./Prescriptions.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const SearchIcon = ({ size = 18, color = "#94a3b8" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
    <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const PillPageIcon = ({ size = 22, color = "#059669" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M10.5 1.5 18.5 9.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="m10.5 1.5-9 9a4.95 4.95 0 0 0 7 7l9-9a4.95 4.95 0 0 0-7-7z" stroke={color} strokeWidth="2" />
    <path d="m8.5 8.5 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const CalendarIcon = ({ size = 14, color = "#94a3b8" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const UserSmIcon = ({ size = 14, color = "#94a3b8" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const CheckIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
  </svg>
);
const BoxIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Status mapping (backend → UI) ─────────────────────────────────────────
const statusMap = {
  Issued: "Pending",
  Ordered: "Ready",
  Taken: "Filled",
};

const statusConfig = {
  Ready: { label: "Ready for Pickup", bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  Pending: { label: "Processing", bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  Filled: { label: "Filled", bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
};

// ── Component ──────────────────────────────────────────────────────────────
export default function Prescriptions({ onBack }) {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patient");

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [patientData, rxData] = await Promise.all([
          apiFetch(`/api/pharmacy/patient/lookup?qr=${encodeURIComponent(patientId)}`),
          apiFetch(`/api/pharmacy/patient/${encodeURIComponent(patientId)}/prescriptions`),
        ]);
        if (cancelled) return;

        const pName = patientData.name || patientId;
        setPrescriptions(
          (rxData.prescriptions || []).map(rx => ({
            id: rx.prescription_id,
            name: pName,
            drug: rx.medicine_name,
            dosage: rx.dosage,
            quantity: [rx.frequency, rx.duration_days ? `${rx.duration_days} days` : ""].filter(Boolean).join(" · "),
            status: statusMap[rx.status] || "Pending",
            date: rx.visit_date,
            doctor: `Dr. ${rx.doctor_name}`,
          }))
        );
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load prescriptions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [patientId]);

  // ── Mark prescription status ─────────────────────────────────────────────
  const handleStatusUpdate = async (prescriptionId, newBackendStatus) => {
    setUpdatingId(prescriptionId);
    try {
      await apiFetch(`/api/pharmacy/prescription/${encodeURIComponent(prescriptionId)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newBackendStatus }),
      });
      // Update local state
      setPrescriptions(prev =>
        prev.map(p =>
          p.id === prescriptionId
            ? { ...p, status: statusMap[newBackendStatus] || p.status }
            : p
        )
      );
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs = [
    { key: "All", label: "All", count: prescriptions.length },
    { key: "Ready", label: "Ready", count: prescriptions.filter(p => p.status === "Ready").length },
    { key: "Pending", label: "Pending", count: prescriptions.filter(p => p.status === "Pending").length },
    { key: "Filled", label: "Filled", count: prescriptions.filter(p => p.status === "Filled").length },
  ];

  const filtered = prescriptions.filter(p => {
    const matchTab = activeTab === "All" || p.status === activeTab;
    const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.drug || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.id || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const readyCount = prescriptions.filter(p => p.status === "Ready").length;
  const pendingCount = prescriptions.filter(p => p.status === "Pending").length;
  const filledCount = prescriptions.filter(p => p.status === "Filled").length;

  return (
    <div className="rx-page-v2">
      {/* HEADER */}
      <div className="rx-page-header">
        <div className="rx-page-header-left">
          <div className="rx-page-icon-wrap">
            <PillPageIcon />
          </div>
          <div>
            <h1 className="rx-page-title">Prescriptions</h1>
            <p className="rx-page-desc">Manage and process patient prescriptions</p>
          </div>
        </div>
        <div className="rx-header-badge">
          {prescriptions.length} Total
        </div>
      </div>

      {/* STATS ROW */}
      <div className="rx-stats-row">
        <div className="rx-stat-card">
          <div className="rx-stat-icon-wrap" style={{ background: "#d1fae5" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke="#059669" strokeWidth="2" /></svg>
          </div>
          <div className="rx-stat-info">
            <div className="rx-stat-num">{readyCount}</div>
            <div className="rx-stat-label">Ready</div>
          </div>
        </div>
        <div className="rx-stat-card">
          <div className="rx-stat-icon-wrap" style={{ background: "#fef3c7" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="2" /><path d="M12 7v5l3 3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="rx-stat-info">
            <div className="rx-stat-num">{pendingCount}</div>
            <div className="rx-stat-label">Pending</div>
          </div>
        </div>
        <div className="rx-stat-card">
          <div className="rx-stat-icon-wrap" style={{ background: "#dbeafe" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#3b82f6" strokeWidth="2" /><path d="M9 12l2 2 4-4" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="rx-stat-info">
            <div className="rx-stat-num">{filledCount}</div>
            <div className="rx-stat-label">Filled</div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="rx-search-bar">
        <div className="rx-search-input-wrap">
          <span className="rx-search-icon"><SearchIcon /></span>
          <input
            className="rx-search-input"
            placeholder="Search by patient name, drug, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="rx-filter-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`rx-filter-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="rx-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* CARDS GRID */}
      <div className="rx-cards-grid">
        {loading ? (
          <div className="rx-empty-state">
            <div className="rx-empty-icon">⏳</div>
            <div className="rx-empty-title">Loading prescriptions...</div>
          </div>
        ) : error ? (
          <div className="rx-empty-state">
            <div className="rx-empty-icon">⚠️</div>
            <div className="rx-empty-title">Error loading prescriptions</div>
            <div className="rx-empty-text">{error}</div>
          </div>
        ) : !patientId ? (
          <div className="rx-empty-state">
            <div className="rx-empty-icon">🔍</div>
            <div className="rx-empty-title">No patient selected</div>
            <div className="rx-empty-text">Scan a patient ID to view their prescriptions.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rx-empty-state">
            <div className="rx-empty-icon">💊</div>
            <div className="rx-empty-title">No prescriptions found</div>
            <div className="rx-empty-text">Try adjusting your search or filter criteria.</div>
          </div>
        ) : (
          filtered.map(p => {
            const s = statusConfig[p.status];
            return (
              <div className="rx-card-v2" key={p.id}>
                <div className="rx-card-header">
                  <div className="rx-card-patient">
                    <div className="rx-card-avatar" style={{ background: s.bg, color: s.color }}>
                      {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="rx-card-name">{p.name}</div>
                      <div className="rx-card-id">{p.id}</div>
                    </div>
                  </div>
                  <span className="rx-status-pill" style={{ background: s.bg, color: s.color }}>
                    <span className="rx-status-dot" style={{ background: s.dot }} />
                    {s.label}
                  </span>
                </div>

                <div className="rx-card-drug-section">
                  <div className="rx-card-drug-name">{p.drug}</div>
                  <div className="rx-card-drug-details">
                    <div className="rx-card-detail-item">
                      <span className="rx-detail-label">Dosage</span>
                      <span className="rx-detail-value">{p.dosage}</span>
                    </div>
                    <div className="rx-card-detail-item">
                      <span className="rx-detail-label">Quantity</span>
                      <span className="rx-detail-value">{p.quantity}</span>
                    </div>
                  </div>
                </div>

                <div className="rx-card-footer-v2">
                  <span className="rx-footer-item">
                    <CalendarIcon /> {p.date}
                  </span>
                  <span className="rx-footer-item">
                    <UserSmIcon /> {p.doctor}
                  </span>
                </div>

                {/* ── Action Buttons ── */}
                {p.status === "Pending" && (
                  <div className="rx-card-actions">
                    <button
                      className="rx-action-btn rx-action-ready"
                      disabled={updatingId === p.id}
                      onClick={() => handleStatusUpdate(p.id, "Ordered")}
                    >
                      <CheckIcon size={15} color="white" />
                      {updatingId === p.id ? "Updating..." : "Mark as Ready"}
                    </button>
                  </div>
                )}
                {p.status === "Ready" && (
                  <div className="rx-card-actions">
                    <button
                      className="rx-action-btn rx-action-dispensed"
                      disabled={updatingId === p.id}
                      onClick={() => handleStatusUpdate(p.id, "Taken")}
                    >
                      <BoxIcon size={15} color="white" />
                      {updatingId === p.id ? "Updating..." : "Mark as Dispensed"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
