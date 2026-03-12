import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PharmacyDashboard.css";

// ── Skeleton ──────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 18, style = {} }) {
    return (
        <div style={{
            width: w, height: h, borderRadius: 6,
            background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            ...style,
        }} />
    );
}

// ── Icons ──────────────────────────────────────────────────────────────────
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
const QRIcon = ({ size = 24, color = "white" }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <path d="M14 14h2v2h-2zM18 14h3M14 18h3M19 18v3M19 21h-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────
function getInitials(name) {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
const AVATAR_COLORS = ["#6366f1", "#0d9488", "#d97706", "#3b82f6", "#ef4444"];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
}

// ── Data ───────────────────────────────────────────────────────────────────
const stats = [
    { label: "Active Prescriptions", value: 0, icon: s => <PillIcon color="#6366f1" size={s} />, iconBg: "#ede9fe", statColor: "#6366f1", trend: "", trendUp: true },
    { label: "Pending Orders", value: 0, icon: s => <ClockIcon color="#d97706" size={s} />, iconBg: "#fef3c7", statColor: "#d97706", trend: "", trendUp: false },
    { label: "Dispensed Today", value: 0, icon: s => <BoxIcon color="#10b981" size={s} />, iconBg: "#d1fae5", statColor: "#10b981", trend: "", trendUp: true },
    { label: "Low Stock Alerts", value: 0, icon: s => <AlertIcon color="#ef4444" size={s} />, iconBg: "#fee2e2", statColor: "#ef4444", trend: "", trendUp: false },
];

const quickActions = [
    { label: "Prescriptions", desc: "Manage & process", icon: "💊", path: "/pharmacy/prescriptions" },
    { label: "Inventory", desc: "Track stock levels", icon: "📦", path: "/pharmacy/inventory" },
    { label: "Priority Orders", desc: "Urgent items", icon: "🚨", path: "/pharmacy/priority-orders" },
    { label: "Scan Patient", desc: "QR code lookup", icon: "📷", path: "/pharmacy/scan-id" },
];

const recentPrescriptions = [];

const activities = [];

// ── Component ──────────────────────────────────────────────────────────────
export default function DashboardHome() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [width, setWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 900);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const isDesktop = width >= 1024;
    const isTablet = width >= 640 && width < 1024;

    return (
        <>
            <style>{`
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .animate-in { animation: slideUp .45s cubic-bezier(.22,1,.36,1) both; }
                .delay-1 { animation-delay:.1s; }
                .delay-2 { animation-delay:.2s; }
                .delay-3 { animation-delay:.3s; }
                .delay-4 { animation-delay:.4s; }
            `}</style>

            {/* GREETING BANNER */}
            <div className="animate-in" style={{
                background: "linear-gradient(135deg, #052e16, #064e3b, #065f46)",
                borderRadius: 16, color: "#fff", marginBottom: 28,
                padding: "28px 32px",
                boxShadow: "0 10px 40px rgba(5,46,22,.25)",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
                    <div>
                        <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, letterSpacing: "-.3px" }}>
                            {getGreeting()}, Pharmacist 👋
                        </h2>
                        <p style={{ margin: 0, opacity: .75, fontSize: 15 }}>
                            {loading
                                ? "Loading your dashboard…"
                                : "Welcome to your pharmacy dashboard."
                            }
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={() => navigate("/pharmacy/prescriptions")} className="ph-btn-primary">
                            <PillIcon color="white" size={16} />
                            Prescriptions
                        </button>
                        <button onClick={() => navigate("/pharmacy/scan-id")} className="ph-btn-ghost">
                            <QRIcon size={16} />
                            Scan Patient
                        </button>
                    </div>
                </div>
            </div>

            {/* STATS */}
            <div className="ph-stats-grid animate-in delay-1">
                {stats.map(s => (
                    <div className="ph-stat-card" key={s.label} style={{ "--stat-color": s.statColor }}>
                        <div className="ph-stat-icon-wrap" style={{ background: s.iconBg }}>
                            {s.icon(isDesktop ? 28 : isTablet ? 26 : 24)}
                        </div>
                        {loading
                            ? <Skeleton h={36} w={60} style={{ marginBottom: 4 }} />
                            : <div className="ph-stat-value" style={{ color: s.statColor }}>{s.value}</div>
                        }
                        <div className="ph-stat-label">{s.label}</div>
                        {!loading && s.trend && (
                            <div className="ph-stat-trend" style={{ color: s.trendUp ? "#10b981" : "#ef4444" }}>
                                {s.trendUp ? "↑" : "↓"} {s.trend}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* MAIN 2-COLUMN GRID */}
            <div className="ph-dash-grid">

                {/* LEFT: Recent Prescriptions */}
                <div className="ph-table-card animate-in delay-2">
                    <div className="ph-section-header" style={{ padding: "20px 20px 0" }}>
                        <div className="ph-section-title" style={{ marginBottom: 0 }}>Recent Prescriptions</div>
                        <button className="ph-view-all-btn" onClick={() => navigate("/pharmacy/prescriptions")}>
                            View All
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} h={56} />)}
                        </div>
                    ) : (
                        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
                            {recentPrescriptions.map((p, i) => {
                                const initials = getInitials(p.name);
                                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                const statusCls = p.status === "Ready"
                                    ? "ph-badge--ready"
                                    : p.status === "Pending"
                                        ? "ph-badge--pending"
                                        : "ph-badge--filled";
                                return (
                                    <div key={p.id} className="ph-rx-row">
                                        <div className="ph-rx-avatar" style={{ background: avatarColor }}>{initials}</div>
                                        <div className="ph-rx-info">
                                            <div className="ph-rx-name">{p.name}</div>
                                            <div className="ph-rx-meta">
                                                {p.drug} · <span className="ph-rx-id">{p.id}</span>
                                            </div>
                                        </div>
                                        <div className="ph-rx-right">
                                            <span className={`ph-table-badge ${statusCls}`}>{p.status}</span>
                                            <div className="ph-rx-date">{p.date}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Quick Actions */}
                    <div className="ph-table-card animate-in delay-3">
                        <div style={{ padding: "20px" }}>
                            <div className="ph-section-title" style={{ marginBottom: 16 }}>Quick Actions</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {quickActions.map(a => (
                                    <button
                                        key={a.label}
                                        onClick={() => navigate(a.path)}
                                        className="ph-quick-action-btn"
                                    >
                                        <span style={{ fontSize: 26 }}>{a.icon}</span>
                                        <span style={{ fontWeight: 700, fontSize: 13 }}>{a.label}</span>
                                        <span style={{ fontSize: 11, color: "var(--ph-text-muted)" }}>{a.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Today's Activity */}
                    <div className="ph-activity-card animate-in delay-4">
                        <div style={{ padding: "20px 20px 4px" }}>
                            <div className="ph-section-title">Today's Activity</div>
                        </div>
                        {loading ? (
                            <div style={{ padding: "8px 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                                {[1, 2, 3].map(i => <Skeleton key={i} h={48} />)}
                            </div>
                        ) : (
                            activities.map((a, i) => (
                                <div className="ph-activity-item" key={i}>
                                    <div className="ph-activity-dot" style={{ background: a.color }} />
                                    <div className="ph-activity-body">
                                        <div className="ph-activity-text">{a.text}</div>
                                        <div className="ph-activity-time">{a.time}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
