import { useState, useEffect } from "react";
import "./Dashboard.css";
import Prescriptions from "./Prescriptions";
import Inventory from "./Inventory";
import ScanID from "./ScanID";
import PriorityOrders from "./Priorityorders";

// ── Icons ──────────────────────────────────────────────────────────────────
const HomeIcon = ({ active, size = 22 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M3 12L12 3l9 9" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10v11h14V10" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 21V13h6v8" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PillIcon = ({ color = "#6366f1", size = 24 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke={color} strokeWidth="2"/>
    <path d="M12 8.5v7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const ClockIcon = ({ color = "#14b8a6", size = 24 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const BoxIcon = ({ color = "#10b981", size = 24 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="2"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="22.08" x2="12" y2="12" stroke={color} strokeWidth="2"/>
  </svg>
);
const AlertIcon = ({ color = "#f43f5e", size = 24 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1" fill={color}/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2"/>
    <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const QRIcon = ({ size = 24, color = "white" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2"/>
    <path d="M14 14h2v2h-2zM18 14h3M14 18h3M19 18v3M19 21h-2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const UserIcon = ({ active, size = 22 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? "#2dd4bf" : "#9ca3af"} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const BellIcon = ({ size = 22 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ── Data ───────────────────────────────────────────────────────────────────
const stats = [
  { label: "Active Prescriptions", value: 24,  icon: (s) => <PillIcon  color="#6366f1" size={s}/>, iconBg: "#e0e7ff", trend: "+3 today" },
  { label: "Pending Orders",       value: 12,  icon: (s) => <ClockIcon color="#14b8a6" size={s}/>, iconBg: "#ccfbf1", trend: "2 urgent" },
  { label: "In Stock Items",       value: 342, icon: (s) => <BoxIcon   color="#10b981" size={s}/>, iconBg: "#d1fae5", trend: "Healthy"  },
  { label: "Low Stock Alerts",     value: 8,   icon: (s) => <AlertIcon color="#f43f5e" size={s}/>, iconBg: "#ffd7e0", trend: "Action needed" },
];

const quickActions = [
  { label: "Prescriptions",   bg: "#6366f1", icon: (s) => <PillIcon  color="white" size={s}/>, page: "prescriptions" },
  { label: "Inventory",       bg: "#10b981", icon: (s) => <BoxIcon   color="white" size={s}/>, page: "inventory" },
  { label: "Priority Orders", bg: "#f43f5e", icon: (s) => <AlertIcon color="white" size={s}/>, page: "priorityorders" },
  { label: "Scan ID", bg: "#14b8a6", icon: (s) => <QRIcon size={s}/>, page: "scanid" },
];

const navItems = [
  { label: "Home",          page: "dashboard",     icon: (a, s) => <HomeIcon active={a} size={s}/> },
  { label: "Prescriptions", page: "prescriptions", icon: (a, s) => <PillIcon color={a ? "#2dd4bf" : "#9ca3af"} size={s}/> },
  { label: "Inventory",     page: "inventory",            icon: (a, s) => <BoxIcon  color={a ? "#2dd4bf" : "#9ca3af"} size={s}/> },
  { label: "Scan ID",       page: "scanid",        icon: (a, s) => <QRIcon   size={s} color={a ? "#2dd4bf" : "#9ca3af"}/> }
];


function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [activeNav, setActiveNav]     = useState("Home");
  const [search, setSearch]           = useState("");
  const [width, setWidth]             = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  // ── Page Router ──────────────────────────────────────────────────────────
  if (currentPage === "prescriptions") {
    return (
      <Prescriptions
        onBack={() => {
          setCurrentPage("dashboard");
          setActiveNav("Home");
        }}
      />
    );
  }

  if (currentPage === "inventory") {
  return <Inventory onBack={() => { setCurrentPage("dashboard"); setActiveNav("Home"); }} />;
}


if (currentPage === "scanid") {
  return (
    <ScanID
      onBack={() => { setCurrentPage("dashboard"); setActiveNav("Home"); }}
      onViewPrescriptions={() => setCurrentPage("prescriptions")}
    />
  );
}

if (currentPage === "priorityorders") {
  return (
    <PriorityOrders
      onBack={() => { setCurrentPage("dashboard"); setActiveNav("Home"); }}
    />
  );
}
  // ── Nav click handler ─────────────────────────────────────────────────────
  const handleNav = (item) => {
    setActiveNav(item.label);
    if (item.page && item.page !== "dashboard") {
      setCurrentPage(item.page);
    }
  };

  // ── Dashboard render ──────────────────────────────────────────────────────
  return (
    <>
      <style>{}</style>

      <div className="dash-root">

        {/* DESKTOP SIDEBAR */}
        {isDesktop && (
          <aside className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-dot">
                <BoxIcon color="white" size={18}/>
              </div>
              <div>
                <div className="logo-text">Nexuscare</div>
                <div className="logo-sub">Portal</div>
              </div>
            </div>

            <nav className="sidebar-nav">
              {navItems.map(item => {
                const isActive = activeNav === item.label;
                return (
                  <div
                    key={item.label}
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => handleNav(item)}
                  >
                    {item.icon(isActive, 20)}
                    {item.label}
                  </div>
                );
              })}
            </nav>

            <div className="sidebar-bottom">
              <div className="sidebar-profile">
                <div className="avatar">NP</div>
                <div>
                  <div className="profile-name">Dr. Nimal Perera</div>
                  <div className="profile-title">Pharmacist</div>
                </div>
              </div>
            </div>
          </aside>
        )}

        <div className="main-area">

          {/* TOPBAR — tablet + desktop */}
          {!isMobile && (
            <div className="topbar">
              <div>
                <div className="topbar-greeting">{getGreeting()}, Dr. Perera 👋</div>
                <div className="topbar-sub">Here's what's happening today</div>
              </div>
              <div className="topbar-right">
                <div className="topbar-search-wrap">
                  <span className="search-icon-abs"><SearchIcon /></span>
                  <input
                    placeholder="Search prescriptions, patients..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <button className="icon-btn"><BellIcon size={18}/></button>
                {isTablet && <div className="avatar">NP</div>}
              </div>
            </div>
          )}

          {/* TAB NAV — tablet only */}
          {isTablet && (
            <div className="tab-nav">
              {navItems.map(item => {
                const isActive = activeNav === item.label;
                return (
                  <div
                    key={item.label}
                    className={`tab-item ${isActive ? "active" : ""}`}
                    onClick={() => handleNav(item)}
                  >
                    {item.icon(isActive, 16)}
                    {item.label}
                  </div>
                );
              })}
            </div>
          )}

          {/* SCROLL CONTENT */}
          <div className="content">

            {/* MOBILE HEADER */}
            {isMobile && (
              <div className="mobile-header">
                <div className="mobile-header-top">
                  <div>
                    <div className="mobile-greeting">{getGreeting()}</div>
                    <div className="mobile-name">Dr. Nimal Perera</div>
                  </div>
                  <div className="avatar">NP</div>
                </div>
                <div className="mobile-search-wrap">
                  <span className="search-icon-abs" style={{ left: 14 }}><SearchIcon /></span>
                  <input
                    placeholder="Search prescriptions, patients..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="page-body">

              {/* STATS */}
              <div className="stats-grid">
                {stats.map(s => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-icon-wrap" style={{ background: s.iconBg }}>
                      {s.icon(isDesktop ? 28 : isTablet ? 26 : 24)}
                    </div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-trend">{s.trend}</div>
                  </div>
                ))}
              </div>

              {/* QUICK ACTIONS */}
              <div className="section-gap">
                <div className="section-title">Quick Actions</div>
                <div className="actions-row">
                  {quickActions.map(a => (
                    <div
                      className="action-item"
                      key={a.label}
                      onClick={() => a.page && setCurrentPage(a.page)}
                      style={{ cursor: a.page ? "pointer" : "default" }}
                    >
                      <div className="action-btn" style={{ background: a.bg }}>
                        {a.icon(isTablet || isDesktop ? 26 : 22)}
                      </div>
                      <span className="action-label">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* BOTTOM NAV — mobile only */}
          {isMobile && (
            <nav className="bottom-nav">
              {navItems.map(item => {
                const isActive = activeNav === item.label;
                return (
                  <div
                    key={item.label}
                    className="nav-item"
                    onClick={() => handleNav(item)}
                  >
                    {item.icon(isActive, 22)}
                    <span className="nav-label" style={{ color: isActive ? "#2dd4bf" : "#9ca3af" }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </nav>
          )}

        </div>
      </div>
    </>
  );
}