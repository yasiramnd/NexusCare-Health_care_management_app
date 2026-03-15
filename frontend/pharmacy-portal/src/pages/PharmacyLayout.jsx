import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { pharmacyLogout } from "../api/client";
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
const ProfileIcon = ({ active, size = 22 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" stroke={active ? "#34d399" : "#9ca3af"} strokeWidth="2" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? "#34d399" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const OrdersIcon = ({ active, size = 22 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke={active ? "#34d399" : "#9ca3af"} strokeWidth="2" />
        <path d="M8 10h8M8 14h5" stroke={active ? "#34d399" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const AvailabilityIcon = ({ active, size = 22 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke={active ? "#34d399" : "#9ca3af"} strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke={active ? "#34d399" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

// ── Helpers ────────────────────────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
}

const navItems = [
    { label: "Home", path: "/pharmacy/dashboard", icon: (a, s) => <HomeIcon active={a} size={s} /> },
    { label: "Prescriptions", path: "/pharmacy/prescriptions", icon: (a, s) => <PillIcon color={a ? "#34d399" : "#9ca3af"} size={s} /> },
    { label: "Inventory", path: "/pharmacy/inventory", icon: (a, s) => <BoxIcon color={a ? "#34d399" : "#9ca3af"} size={s} /> },
    { label: "Priority", path: "/pharmacy/priority-orders", icon: (a, s) => <AlertIcon color={a ? "#34d399" : "#9ca3af"} size={s} /> },
    { label: "Orders", path: "/pharmacy/normal-orders", icon: (a, s) => <OrdersIcon active={a} size={s} /> },
    { label: "Scan ID", path: "/pharmacy/scan-id", icon: (a, s) => <QRIcon size={s} color={a ? "#34d399" : "#9ca3af"} /> },
    { label: "Availability", path: "/pharmacy/availability", icon: (a, s) => <AvailabilityIcon active={a} size={s} /> },
    { label: "Profile", path: "/pharmacy/profile", icon: (a, s) => <ProfileIcon active={a} size={s} /> },
];

// ── Layout Component ───────────────────────────────────────────────────────
export default function PharmacyLayout() {
    const navigate = useNavigate();
    const location = useLocation();
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

    const getActiveLabel = () => {
        const item = navItems.find(n => location.pathname === n.path);
        return item ? item.label : "Home";
    };

    return (
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
                        <p className="ph-sidebar-section-label">OVERVIEW</p>
                        {navItems.slice(0, 1).map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <div
                                    key={item.label}
                                    className={`ph-sidebar-nav-item ${isActive ? "active" : ""}`}
                                    onClick={() => navigate(item.path)}
                                >
                                    {item.icon(isActive, 20)}
                                    {item.label}
                                </div>
                            );
                        })}
                        <p className="ph-sidebar-section-label">OPERATIONS</p>
                        {navItems.slice(1, 7).map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <div
                                    key={item.label}
                                    className={`ph-sidebar-nav-item ${isActive ? "active" : ""}`}
                                    onClick={() => navigate(item.path)}
                                >
                                    {item.icon(isActive, 20)}
                                    {item.label}
                                </div>
                            );
                        })}
                        <p className="ph-sidebar-section-label">ACCOUNT</p>
                        {navItems.slice(7).map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <div
                                    key={item.label}
                                    className={`ph-sidebar-nav-item ${isActive ? "active" : ""}`}
                                    onClick={() => navigate(item.path)}
                                >
                                    {item.icon(isActive, 20)}
                                    {item.label}
                                </div>
                            );
                        })}
                    </nav>

                    <div className="ph-sidebar-bottom">
                        <div className="ph-sidebar-profile" onClick={() => navigate("/pharmacy/profile")} style={{ cursor: "pointer" }}>
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
                            <div className="ph-topbar-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
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
                            <button className="ph-icon-btn ph-notification-btn"><BellIcon size={18} /><span className="ph-notification-dot">3</span></button>
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
                            const isActive = location.pathname === item.path;
                            return (
                                <div
                                    key={item.label}
                                    className={`ph-tab-item ${isActive ? "active" : ""}`}
                                    onClick={() => navigate(item.path)}
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
                        <Outlet />
                    </div>
                </div>

                {/* BOTTOM NAV — mobile only */}
                {isMobile && (
                    <nav className="ph-bottom-nav">
                        {navItems.map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <div
                                    key={item.label}
                                    className="ph-nav-item"
                                    onClick={() => navigate(item.path)}
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
    );
}
