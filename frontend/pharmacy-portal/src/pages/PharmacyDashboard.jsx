import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { pharmacyLogout } from "../api/client";
import Prescriptions from "../components/Prescriptions";
import Inventory from "../components/Inventory";
import ScanID from "../components/ScanID";
import PriorityOrders from "../components/PriorityOrders";
import "./PharmacyDashboard.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const HomeIcon = ({ active, size = 22 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <path d="M3 12L12 3l9 9" stroke={active ? "#34d399" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v11h14V10" stroke={active ? "#34d399" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V13h6v8" stroke={active ? "#34d399" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const PillIcon = ({ color = "#6366f1", size = 24 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <path d="M10.5 1.5 18.5 9.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="m10.5 1.5-9 9a4.95 4.95 0 0 0 7 7l9-9a4.95 4.95 0 0 0-7-7z" stroke={color} strokeWidth="2" />
        <path d="m8.5 8.5 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const ClockIcon = ({ color = "#10b981", size = 24 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const BoxIcon = ({ color = "#10b981", size = 24 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="2" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke={color} strokeWidth="2" />
        <line x1="12" y1="22.08" x2="12" y2="12" stroke={color} strokeWidth="2" />
    </svg>
);
const AlertIcon = ({ color = "#f43f5e", size = 24 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill={color} />
    </svg>
);
const SearchIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const QRIcon = ({ size = 24, color = "white" }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <path d="M14 14h2v2h-2zM18 14h3M14 18h3M19 18v3M19 21h-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const LogoutIcon = ({ size = 20 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
const BellIcon = ({ size = 22 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 01-3.46 0" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// ── Data ───────────────────────────────────────────────────────────────────
const stats = [
    { label: "Active Prescriptions", value: 24, icon: (s) => <PillIcon color="#6366f1" size={s} />, iconBg: "#e0e7ff", trend: "+3 today" },
    { label: "Pending Orders", value: 12, icon: (s) => <ClockIcon color="#10b981" size={s} />, iconBg: "#d1fae5", trend: "2 urgent" },
    { label: "In Stock Items", value: 342, icon: (s) => <BoxIcon color="#059669" size={s} />, iconBg: "#d1fae5", trend: "Healthy" },
    { label: "Low Stock Alerts", value: 8, icon: (s) => <AlertIcon color="#f43f5e" size={s} />, iconBg: "#ffd7e0", trend: "Action needed" },
];

const quickActions = [
    { label: "Prescriptions", bg: "#6366f1", icon: (s) => <PillIcon color="white" size={s} />, page: "prescriptions" },
    { label: "Inventory", bg: "#059669", icon: (s) => <BoxIcon color="white" size={s} />, page: "inventory" },
    { label: "Priority Orders", bg: "#f43f5e", icon: (s) => <AlertIcon color="white" size={s} />, page: "priorityorders" },
    { label: "Scan ID", bg: "#10b981", icon: (s) => <QRIcon size={s} />, page: "scanid" },
];

const navItems = [
    { label: "Home", page: "dashboard", icon: (a, s) => <HomeIcon active={a} size={s} /> },
    { label: "Prescriptions", page: "prescriptions", icon: (a, s) => <PillIcon color={a ? "#34d399" : "#9ca3af"} size={s} /> },
    { label: "Inventory", page: "inventory", icon: (a, s) => <BoxIcon color={a ? "#34d399" : "#9ca3af"} size={s} /> },
    { label: "Scan ID", page: "scanid", icon: (a, s) => <QRIcon size={s} color={a ? "#34d399" : "#9ca3af"} /> },
];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
}

// ── Component ──────────────────────────────────────────────────────────────
export default function PharmacyDashboard() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState("dashboard");
    const [activeNav, setActiveNav] = useState("Home");
    const [search, setSearch] = useState("");
    const [width, setWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );

    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const isDesktop = width >= 1024;

    function handleLogout() {
        pharmacyLogout();
        navigate("/pharmacy/login");
    }

    const handleNav = (item) => {
        setActiveNav(item.label);
        if (item.page && item.page !== "dashboard") {
            setCurrentPage(item.page);
        } else {
            setCurrentPage("dashboard");
        }
    };

    const renderDashboardContent = () => {
        if (currentPage === "prescriptions") {
            return <Prescriptions onBack={() => { setCurrentPage("dashboard"); setActiveNav("Home"); }} />;
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
            return <PriorityOrders onBack={() => { setCurrentPage("dashboard"); setActiveNav("Home"); }} />;
        }
        // Default dashboard
        return (
            <>
                {/* STATS */}
                <div className="ph-stats-grid">
                    {stats.map(s => (
                        <div className="ph-stat-card" key={s.label}>
                            <div className="ph-stat-icon-wrap" style={{ background: s.iconBg }}>
                                {s.icon(isDesktop ? 28 : isTablet ? 26 : 24)}
                            </div>
                            <div className="ph-stat-value">{s.value}</div>
                            <div className="ph-stat-label">{s.label}</div>
                            <div className="ph-stat-trend">{s.trend}</div>
                        </div>
                    ))}
                </div>

                {/* QUICK ACTIONS */}
                <div className="ph-section-gap">
                    <div className="ph-section-title">Quick Actions</div>
                    <div className="ph-actions-row">
                        {quickActions.map(a => (
                            <div
                                className="ph-action-item"
                                key={a.label}
                                onClick={() => a.page && setCurrentPage(a.page)}
                                style={{ cursor: a.page ? "pointer" : "default" }}
                            >
                                <div className="ph-action-btn" style={{ background: a.bg }}>
                                    {a.icon(isTablet || isDesktop ? 26 : 22)}
                                </div>
                                <span className="ph-action-label">{a.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    };

    // ── Dashboard render ──────────────────────────────────────────────────────
    return (
        <>
            <div className="ph-dash-root">

                {/* DESKTOP SIDEBAR */}
                {isDesktop && (
                    <aside className="ph-sidebar">
                        <div className="ph-sidebar-logo">
                            <div className="ph-logo-dot">💊</div>
                            <div>
                                <div className="ph-logo-text">NexusCare</div>
                                <div className="ph-logo-sub">Pharmacy Portal</div>
                            </div>
                        </div>

                        <nav className="ph-sidebar-nav">
                            {navItems.map(item => {
                                const isActive = activeNav === item.label;
                                return (
                                    <div
                                        key={item.label}
                                        className={`ph-sidebar-nav-item ${isActive ? "active" : ""}`}
                                        onClick={() => handleNav(item)}
                                    >
                                        {item.icon(isActive, 20)}
                                        {item.label}
                                    </div>
                                );
                            })}
                        </nav>

                        <div className="ph-sidebar-bottom">
                            <div className="ph-sidebar-profile">
                                <div className="ph-avatar">PH</div>
                                <div>
                                    <div className="ph-profile-name">Pharmacy</div>
                                    <div className="ph-profile-title">Pharmacist</div>
                                </div>
                            </div>
                            <button className="ph-logout-btn" onClick={handleLogout}>
                                <LogoutIcon size={18} />
                                Sign Out
                            </button>
                        </div>
                    </aside>
                )}

                <div className="ph-main-area">

                    {/* TOPBAR — tablet + desktop */}
                    {!isMobile && (
                        <div className="ph-topbar">
                            <div>
                                <div className="ph-topbar-greeting">{getGreeting()}, Pharmacist 👋</div>
                                <div className="ph-topbar-sub">Here's what's happening today</div>
                            </div>
                            <div className="ph-topbar-right">
                                <div className="ph-topbar-search-wrap">
                                    <span className="ph-search-icon-abs"><SearchIcon /></span>
                                    <input
                                        placeholder="Search prescriptions, patients..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <button className="ph-icon-btn"><BellIcon size={18} /></button>
                                {isTablet && (
                                    <button className="ph-avatar ph-logout-btn-sm" onClick={handleLogout} title="Sign Out">
                                        <LogoutIcon size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB NAV — tablet only */}
                    {isTablet && (
                        <div className="ph-tab-nav">
                            {navItems.map(item => {
                                const isActive = activeNav === item.label;
                                return (
                                    <div
                                        key={item.label}
                                        className={`ph-tab-item ${isActive ? "active" : ""}`}
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
                    <div className="ph-content">

                        {/* MOBILE HEADER */}
                        {isMobile && (
                            <div className="ph-mobile-header">
                                <div className="ph-mobile-header-top">
                                    <div>
                                        <div className="ph-mobile-greeting">{getGreeting()}</div>
                                        <div className="ph-mobile-name">Pharmacy Portal</div>
                                    </div>
                                    <button className="ph-avatar" onClick={handleLogout} style={{ cursor: "pointer" }} title="Sign Out">
                                        <LogoutIcon size={18} />
                                    </button>
                                </div>
                                <div className="ph-mobile-search-wrap">
                                    <span className="ph-search-icon-abs" style={{ left: 14 }}><SearchIcon /></span>
                                    <input
                                        placeholder="Search prescriptions, patients..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="ph-page-body">
                            {renderDashboardContent()}
                        </div>
                    </div>

                    {/* BOTTOM NAV — mobile only */}
                    {isMobile && (
                        <nav className="ph-bottom-nav">
                            {navItems.map(item => {
                                const isActive = activeNav === item.label;
                                return (
                                    <div
                                        key={item.label}
                                        className="ph-nav-item"
                                        onClick={() => handleNav(item)}
                                    >
                                        {item.icon(isActive, 22)}
                                        <span className="ph-nav-label" style={{ color: isActive ? "#34d399" : "#9ca3af" }}>
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
