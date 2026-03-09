import { useState } from "react";
import "./Prescriptions.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
    <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const FilterIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BackIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const HomeIcon = ({ active }) => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <path d="M3 12L12 3l9 9" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10v11h14V10" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 21V13h6v8" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PillIcon = ({ color = "#9ca3af", size = 22 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke={color} strokeWidth="2" />
    <path d="M12 8.5v7" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const BoxIcon = ({ color = "#9ca3af", size = 22 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="2" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke={color} strokeWidth="2" />
    <line x1="12" y1="22.08" x2="12" y2="12" stroke={color} strokeWidth="2" />
  </svg>
);
const UserIcon = ({ active }) => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── Data ───────────────────────────────────────────────────────────────────
const prescriptions = [
  {
    id: "PID-2891", name: "Sarah Johnson", status: "Ready",
    drug: "Amoxicillin 500mg", dosage: "3 times daily", quantity: "30 capsules",
    date: "Jan 12, 2026", doctor: "Dr. Smith",
  },
  {
    id: "PID-3245", name: "Michael Chen", status: "Pending",
    drug: "Lisinopril 10mg", dosage: "Once daily", quantity: "90 tablets",
    date: "Jan 12, 2026", doctor: "Dr. Anderson",
  },
  {
    id: "PID-4782", name: "Emma Davis", status: "Filled",
    drug: "Metformin 1000mg", dosage: "Twice daily", quantity: "60 tablets",
    date: "Jan 11, 2026", doctor: "Dr. Williams",
  },
  {
    id: "PID-5890", name: "Olivia Martinez", status: "Ready",
    drug: "Omeprazole 40mg", dosage: "Once daily before meal", quantity: "30 capsules",
    date: "Jan 10, 2026", doctor: "Dr. Taylor",
  },
  {
    id: "PID-5421", name: "James Wilson", status: "Pending",
    drug: "Atorvastatin 20mg", dosage: "Once daily at bedtime", quantity: "30 tablets",
    date: "Jan 11, 2026", doctor: "Dr. Arnav",
  },
  {
    id: "PID-6102", name: "Liam Brown", status: "Filled",
    drug: "Amlodipine 5mg", dosage: "Once daily", quantity: "30 tablets",
    date: "Jan 9, 2026", doctor: "Dr. Patel",
  },
];

const statusConfig = {
  Ready: { label: "Ready for Pickup", bg: "#d1fae5", color: "#065f46" },
  Pending: { label: "Processing", bg: "#fef3c7", color: "#92400e" },
  Filled: { label: "Filled", bg: "#dbeafe", color: "#1e40af" },
};

const tabs = [
  { key: "All", label: "All", count: prescriptions.length },
  { key: "Ready", label: "Ready", count: prescriptions.filter(p => p.status === "Ready").length },
  { key: "Pending", label: "Pending", count: prescriptions.filter(p => p.status === "Pending").length },
  { key: "Filled", label: "Filled", count: prescriptions.filter(p => p.status === "Filled").length },
];

const navItems = [
  { label: "Home", icon: (a) => <HomeIcon active={a} /> },
  { label: "Prescriptions", icon: (a) => <PillIcon color={a ? "#2dd4bf" : "#9ca3af"} /> },
  { label: "Inventory", icon: (a) => <BoxIcon color={a ? "#2dd4bf" : "#9ca3af"} /> },
  { label: "Profile", icon: (a) => <UserIcon active={a} /> },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Prescriptions({ onBack }) {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("Prescriptions");

  const filtered = prescriptions.filter(p => {
    const matchTab = activeTab === "All" || p.status === activeTab;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.drug.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="rx-page" style={{ minHeight: "auto", background: "transparent", padding: 0, maxWidth: "100%" }}>
      {/* HEADER */}
      <div className="rx-header" style={{ padding: "0 0 20px" }}>
        <div>
          <h1 className="rx-title">Prescriptions</h1>
          <p style={{ color: "var(--p-text-dim)", fontSize: "14px", marginTop: "4px" }}>Manage and process patient prescriptions seamlessly.</p>
        </div>
      </div>

      {/* SEARCH AND FILTER */}
      <div className="rx-search-wrap" style={{ padding: "0", marginBottom: "20px" }}>
        <div className="rx-search">
          <span className="rx-search-icon"><SearchIcon /></span>
          <input
            placeholder="Search prescriptions by name, drug, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABS */}
      <div className="rx-tabs" style={{ padding: "0 0 20px" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`rx-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="rx-list" style={{ padding: "0", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {filtered.length === 0 ? (
          <div className="rx-empty" style={{ gridColumn: "1 / -1", padding: "60px 20px" }}>
            <div className="rx-empty-icon">💊</div>
            No prescriptions found matching your search.
          </div>
        ) : (
          filtered.map(p => {
            const s = statusConfig[p.status];
            return (
              <div className="rx-card" key={p.id}>
                <div className="rx-card-top">
                  <div>
                    <div className="rx-patient-name">{p.name}</div>
                    <div className="rx-patient-id">{p.id}</div>
                  </div>
                  <span
                    className="rx-status-badge"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>

                <div className="rx-drug-box">
                  <div className="rx-drug-name">{p.drug}</div>
                  <div className="rx-drug-detail">
                    <span>Dosage:</span>{p.dosage}
                  </div>
                  <div className="rx-drug-detail">
                    <span>Quantity:</span>{p.quantity}
                  </div>
                </div>

                <div className="rx-card-footer">
                  <span className="rx-date">{p.date}</span>
                  <span className="rx-doctor">{p.doctor}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
