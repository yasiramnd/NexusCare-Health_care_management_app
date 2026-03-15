import { useState } from "react";
import "./Inventory.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const SearchIcon = ({ size = 18, color = "#94a3b8" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
    <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const BoxPageIcon = ({ size = 22, color = "#059669" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="2" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke={color} strokeWidth="2" />
    <line x1="12" y1="22.08" x2="12" y2="12" stroke={color} strokeWidth="2" />
  </svg>
);
const MapPinIcon = ({ size = 14, color = "#94a3b8" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
  </svg>
);
const CalendarIcon = ({ size = 14, color = "#94a3b8" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const RefreshIcon = ({ size = 14, color = "#94a3b8" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M23 4v6h-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Data ───────────────────────────────────────────────────────────────────
const inventory = [];

const statusConfig = {
  "In Stock": { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  "Low Stock": { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  "Out of Stock": { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

// ── Component ──────────────────────────────────────────────────────────────
export default function Inventory({ onBack }) {
  const [activeTab, setActiveTab] = useState("All Items");
  const [search, setSearch] = useState("");

  const totalItems = inventory.reduce((sum, i) => sum + i.current, 0);
  const lowStockCount = inventory.filter(i => i.status === "Low Stock").length;
  const outOfStock = inventory.filter(i => i.status === "Out of Stock").length;

  const tabs = [
    { key: "All Items", label: "All Items", count: inventory.length },
    { key: "Low Stock", label: "Low Stock", count: lowStockCount },
    { key: "Out of Stock", label: "Out of Stock", count: outOfStock },
  ];

  const filtered = inventory.filter(item => {
    const matchTab = activeTab === "All Items" || item.status === activeTab;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="inv-page-v2">
      {/* HEADER */}
      <div className="inv-page-header">
        <div className="inv-page-header-left">
          <div className="inv-page-icon-wrap">
            <BoxPageIcon />
          </div>
          <div>
            <h1 className="inv-page-title">Inventory</h1>
            <p className="inv-page-desc">Manage stock levels and track pharmacy supplies</p>
          </div>
        </div>
        <div className="inv-header-badge">
          {inventory.length} Products
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="inv-stats-row">
        <div className="inv-stat-card-v2">
          <div className="inv-stat-icon-v2" style={{ background: "#ede9fe" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="#6366f1" strokeWidth="2" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="#6366f1" strokeWidth="2" /></svg>
          </div>
          <div className="inv-stat-info">
            <div className="inv-stat-num">{totalItems}</div>
            <div className="inv-stat-label-v2">Total Units</div>
          </div>
        </div>
        <div className="inv-stat-card-v2">
          <div className="inv-stat-icon-v2" style={{ background: "#fef3c7" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f59e0b" strokeWidth="2" /><line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="17" r="1" fill="#f59e0b" /></svg>
          </div>
          <div className="inv-stat-info">
            <div className="inv-stat-num">{lowStockCount}</div>
            <div className="inv-stat-label-v2">Low Stock</div>
          </div>
        </div>
        <div className="inv-stat-card-v2">
          <div className="inv-stat-icon-v2" style={{ background: "#fee2e2" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="2" /><line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /><line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></svg>
          </div>
          <div className="inv-stat-info">
            <div className="inv-stat-num">{outOfStock}</div>
            <div className="inv-stat-label-v2">Out of Stock</div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="inv-search-bar">
        <div className="inv-search-input-wrap">
          <span className="inv-search-icon"><SearchIcon /></span>
          <input
            className="inv-search-input"
            placeholder="Search by medication name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABS */}
      <div className="inv-filter-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`inv-filter-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="inv-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ITEM CARDS */}
      <div className="inv-cards-grid">
        {filtered.map(item => {
          const s = statusConfig[item.status];
          const stockPct = item.reorder > 0 ? Math.min((item.current / item.reorder) * 100, 100) : 0;
          const isLowOrOut = item.status === "Low Stock" || item.status === "Out of Stock";
          return (
            <div className="inv-card-v2" key={item.id}>
              {/* Card top */}
              <div className="inv-card-header">
                <div>
                  <div className="inv-card-name">{item.name}</div>
                  <div className="inv-card-category">{item.category}</div>
                </div>
                <span className="inv-status-pill" style={{ background: s.bg, color: s.color }}>
                  <span className="inv-status-dot" style={{ background: s.dot }} />
                  {item.status}
                </span>
              </div>

              {/* Stock gauge */}
              <div className="inv-stock-section">
                <div className="inv-stock-numbers">
                  <div className="inv-stock-col-v2">
                    <span className="inv-stock-lbl">Current</span>
                    <span className="inv-stock-val">{item.current}</span>
                  </div>
                  <div className="inv-stock-col-v2">
                    <span className="inv-stock-lbl">Reorder at</span>
                    <span className="inv-stock-val">{item.reorder}</span>
                  </div>
                </div>
                <div className="inv-stock-bar-bg">
                  <div
                    className="inv-stock-bar-fill"
                    style={{
                      width: `${stockPct}%`,
                      background: item.status === "Out of Stock" ? "#ef4444"
                        : item.status === "Low Stock" ? "#f59e0b" : "#10b981",
                    }}
                  />
                </div>
              </div>

              {/* Meta info */}
              <div className="inv-card-meta">
                <span className="inv-meta-item"><MapPinIcon /> {item.location}</span>
                <span className="inv-meta-item"><CalendarIcon /> Exp: {item.expires}</span>
              </div>
              <div className="inv-card-meta">
                <span className="inv-meta-item"><RefreshIcon /> Restocked: {item.restocked}</span>
              </div>

              {/* Reorder button */}
              {isLowOrOut && (
                <button className="inv-reorder-btn-v2">
                  Reorder Now
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
