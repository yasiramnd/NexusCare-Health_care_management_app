import { useState } from "react";
import "./Inventory.css";

// ── Icons ──────────────────────────────────────────────────────────────────
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
const TotalIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="#6366f1" strokeWidth="2" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="#6366f1" strokeWidth="2" />
  </svg>
);
const LowIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f59e0b" strokeWidth="2" />
    <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" fill="#f59e0b" />
  </svg>
);
const OutIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17 6 23 6 23 12" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Data ───────────────────────────────────────────────────────────────────
const inventory = [
  {
    id: 1, name: "Amoxicillin 500mg", category: "Antibiotic", status: "In Stock",
    current: 245, reorder: 100, unit: "units",
    location: "Shelf A-12", expires: "Dec 2026", restocked: "Jan 10, 2026",
  },
  {
    id: 2, name: "Lisinopril 10mg", category: "Blood Pressure", status: "Low Stock",
    current: 78, reorder: 100, unit: "units",
    location: "Shelf B-05", expires: "Nov 2026", restocked: "Jan 8, 2026",
  },
  {
    id: 3, name: "Levothyroxine 50mcg", category: "Thyroid", status: "Low Stock",
    current: 45, reorder: 80, unit: "units",
    location: "Shelf C-02", expires: "Mar 2027", restocked: "Jan 5, 2026",
  },
  {
    id: 4, name: "Atorvastatin 20mg", category: "Cholesterol", status: "Out of Stock",
    current: 0, reorder: 80, unit: "units",
    location: "Shelf A-22", expires: "-", restocked: "Dec 28, 2025",
  },
  {
    id: 5, name: "Metformin 1000mg", category: "Diabetes", status: "In Stock",
    current: 320, reorder: 150, unit: "units",
    location: "Shelf D-01", expires: "Aug 2027", restocked: "Jan 12, 2026",
  },
  {
    id: 6, name: "Omeprazole 20mg", category: "Gastric", status: "In Stock",
    current: 180, reorder: 60, unit: "units",
    location: "Shelf B-11", expires: "Jun 2027", restocked: "Jan 6, 2026",
  },
];

const statusConfig = {
  "In Stock": { bg: "#d1fae5", color: "#065f46" },
  "Low Stock": { bg: "#fef3c7", color: "#92400e" },
  "Out of Stock": { bg: "#fee2e2", color: "#991b1b" },
};

const navItems = [
  { label: "Home", icon: (a) => <HomeIcon active={a} /> },
  { label: "Prescriptions", icon: (a) => <PillIcon color={a ? "#2dd4bf" : "#9ca3af"} /> },
  { label: "Inventory", icon: (a) => <BoxIcon color={a ? "#2dd4bf" : "#9ca3af"} /> },
  { label: "Profile", icon: (a) => <UserIcon active={a} /> },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Inventory({ onBack }) {
  const [activeTab, setActiveTab] = useState("All Items");
  const [activeNav, setActiveNav] = useState("Inventory");

  const totalItems = inventory.length;
  const lowStockCount = inventory.filter(i => i.status === "Low Stock").length;
  const outOfStock = inventory.filter(i => i.status === "Out of Stock").length;

  const tabs = [
    { key: "All Items", label: `All Items (${totalItems})` },
    { key: "Low Stock", label: `Low Stock (${lowStockCount})` },
    { key: "Out of Stock", label: `Out of Stock(${outOfStock})` },
  ];

  const filtered = inventory.filter(item => {
    if (activeTab === "All Items") return true;
    if (activeTab === "Low Stock") return item.status === "Low Stock";
    if (activeTab === "Out of Stock") return item.status === "Out of Stock";
    return true;
  });

  return (
    <div className="inv-page" style={{ minHeight: "auto", background: "transparent", padding: 0, maxWidth: "100%" }}>
      {/* HEADER */}
      <div className="inv-header" style={{ padding: "0 0 20px" }}>
        <div>
          <h1 className="inv-title">Inventory</h1>
          <p style={{ color: "var(--p-text-dim)", fontSize: "14px", marginTop: "4px" }}>Manage stock levels and track pharmacy supplies.</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="inv-stats" style={{ padding: "0 0 24px", gap: "16px" }}>
        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: "#ede9fe" }}><TotalIcon /></div>
          <div className="inv-stat-value">{totalItems * 57}</div>
          <div className="inv-stat-label">Total Items</div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: "#fef3c7" }}><LowIcon /></div>
          <div className="inv-stat-value">{lowStockCount}</div>
          <div className="inv-stat-label">Low Stock</div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: "#fee2e2" }}><OutIcon /></div>
          <div className="inv-stat-value">{outOfStock}</div>
          <div className="inv-stat-label">Out of Stock</div>
        </div>
      </div>

      {/* TABS */}
      <div className="inv-tabs" style={{ padding: "0 0 20px" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`inv-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ITEM LIST */}
      <div className="inv-list" style={{ padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {filtered.map(item => {
          const s = statusConfig[item.status];
          const isLowOrOut = item.status === "Low Stock" || item.status === "Out of Stock";
          return (
            <div className="inv-card" key={item.id}>
              {/* Card top */}
              <div className="inv-card-top">
                <div>
                  <div className="inv-item-name">{item.name}</div>
                  <div className="inv-item-category">{item.category}</div>
                </div>
                <span className="inv-status-badge" style={{ background: s.bg, color: s.color }}>
                  {item.status}
                </span>
              </div>

              {/* Stock row */}
              <div className="inv-stock-row">
                <div className="inv-stock-col">
                  <div className="inv-stock-label">Current Stock</div>
                  <div className="inv-stock-value">{item.current}</div>
                  <div className="inv-stock-unit">{item.unit}</div>
                </div>
                <div className="inv-stock-col">
                  <div className="inv-stock-label">Reorder Level</div>
                  <div className="inv-stock-value">{item.reorder}</div>
                  <div className="inv-stock-unit">{item.unit}</div>
                </div>
              </div>

              {/* Meta */}
              <div className="inv-meta">
                <span>Location: {item.location}</span>
                <span>Expires: {item.expires}</span>
              </div>
              <div className="inv-meta">
                <span>Last Restocked: {item.restocked}</span>
              </div>

              {/* Reorder button for low/out */}
              {isLowOrOut && (
                <button className="inv-reorder-btn">Reorder Now</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
