import { useState } from "react";
import "./PriorityOrders.css";

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
const AlertCircleIcon = ({ color = "#f43f5e" }) => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1" fill={color}/>
  </svg>
);
const ClockIcon = ({ color = "#94a3b8" }) => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.72A2 2 0 012.18 1H5.18a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.92z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const NavigateIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <polygon points="3 11 22 2 13 21 11 13 3 11" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Data ───────────────────────────────────────────────────────────────────
const orders = [
  {
    id: 1,
    name: "Robert Martinez",
    pid: "PID-7821",
    priority: "Critical",
    drug: "Insulin Glargine 100 units/mL",
    quantity: "5",
    unit: "vials",
    reason: "Patient diabetic - last dose today",
    time: "15 mins ago",
    due: "Today, 3:00 PM",
    status: "pending",
  },
  {
    id: 2,
    name: "Linda Thompson",
    pid: "PID-8934",
    priority: "High Priority",
    drug: "Albuterol Inhaler",
    quantity: "2",
    unit: "inhalers",
    reason: "Asthma - patient out of medication",
    time: "32 mins ago",
    due: "Today, 5:00 PM",
    status: "pending",
  },
];

const priorityConfig = {
  "Critical":      { bg: "#ef4444", color: "white",   border: "#fca5a5" },
  "High Priority": { bg: "#f97316", color: "white",   border: "#fdba74" },
  "Normal":        { bg: "#3b82f6", color: "white",   border: "#93c5fd" },
};

const navItems = [
  { label: "Home",          icon: (a) => <HomeIcon active={a} /> },
  { label: "Prescriptions", icon: (a) => <PillIcon color={a ? "#2dd4bf" : "#9ca3af"} /> },
  { label: "Inventory",     icon: (a) => <BoxIcon  color={a ? "#2dd4bf" : "#9ca3af"} /> },
  { label: "Profile",       icon: (a) => <UserIcon active={a} /> },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function PriorityOrders({ onBack }) {
  const [activeNav, setActiveNav] = useState("Home");
  const [orderStatuses, setOrderStatuses] = useState(
    Object.fromEntries(orders.map(o => [o.id, o.status]))
  );

  const handleProcess = (id) => {
    setOrderStatuses(prev => ({ ...prev, [id]: "processing" }));
    setTimeout(() => {
      setOrderStatuses(prev => ({ ...prev, [id]: "done" }));
    }, 2000);
  };

  const urgentCount = orders.filter(o => orderStatuses[o.id] === "pending").length;

  return (
    <div className="po-page">

      {/* HEADER */}
      <div className="po-header">
        <button className="po-back-btn" onClick={onBack}>
          <BackIcon />
        </button>
        <h1 className="po-title">Priority Orders</h1>
      </div>

      {/* ALERT BANNER */}
      {urgentCount > 0 && (
        <div className="po-alert-banner">
          <AlertCircleIcon color="#ef4444" />
          <div>
            <div className="po-alert-title">{urgentCount} urgent order{urgentCount > 1 ? "s" : ""} require attention</div>
            <div className="po-alert-sub">These orders are time-sensitive. Please process immediately.</div>
          </div>
        </div>
      )}

      {urgentCount === 0 && (
        <div className="po-alert-banner success">
          <AlertCircleIcon color="#10b981" />
          <div>
            <div className="po-alert-title" style={{ color: "#065f46" }}>All orders processed!</div>
            <div className="po-alert-sub" style={{ color: "#10b981" }}>No pending priority orders at this time.</div>
          </div>
        </div>
      )}

      {/* ORDERS LIST */}
      <div className="po-list">
        {orders.map(order => {
          const pc = priorityConfig[order.priority];
          const status = orderStatuses[order.id];
          return (
            <div
              className={`po-card ${status === "done" ? "done" : ""}`}
              key={order.id}
              style={{ borderLeftColor: pc.border }}
            >
              {/* Card top */}
              <div className="po-card-top">
                <div>
                  <div className="po-patient-name">{order.name}</div>
                  <div className="po-patient-pid">{order.pid}</div>
                </div>
                <span
                  className="po-priority-badge"
                  style={{ background: pc.bg, color: pc.color }}
                >
                  {status === "done" ? "✓ Done" : order.priority}
                </span>
              </div>

              {/* Drug info */}
              <div className="po-drug-box">
                <div className="po-drug-name">{order.drug}</div>
                <div className="po-drug-meta">Quantity: {order.quantity}</div>
                <div className="po-drug-meta">{order.unit}</div>
              </div>

              {/* Reason */}
              <div className="po-reason-row">
                <AlertCircleIcon color="#f59e0b" />
                <div>
                  <div className="po-reason-label">REASON</div>
                  <div className="po-reason-text">{order.reason}</div>
                </div>
              </div>

              {/* Time & Due */}
              <div className="po-meta-row">
                <span className="po-time"><ClockIcon /> {order.time}</span>
                <span className="po-dot">·</span>
                <span className="po-due">Due: {order.due}</span>
              </div>

              {/* Action row */}
              {status !== "done" && (
                <div className="po-actions">
                  <button
                    className={`po-process-btn ${status === "processing" ? "processing" : ""}`}
                    onClick={() => handleProcess(order.id)}
                    disabled={status === "processing"}
                  >
                    {status === "processing" ? "Processing..." : "Start Processing"}
                  </button>
                  <button className="po-icon-btn"><PhoneIcon /></button>
                  <button className="po-icon-btn"><NavigateIcon /></button>
                </div>
              )}

              {status === "done" && (
                <div className="po-done-row">
                  <div className="po-done-badge">
                    <CheckIcon /> Order Processed
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM NAV */}
      <nav className="po-bottom-nav">
        {navItems.map(item => {
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              className="po-nav-item"
              onClick={() => setActiveNav(item.label)}
            >
              {item.icon(isActive)}
              <span className="po-nav-label" style={{ color: isActive ? "#2dd4bf" : "#9ca3af" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
