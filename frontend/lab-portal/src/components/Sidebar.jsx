import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/portal.css";

// ── Icons ──────────────────────────────────────────────────
const DashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);
const FlaskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6v10l4 7H5l4-7V3z" />
    <line x1="9" y1="9" x2="15" y2="9" />
  </svg>
);
const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-5.1" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const BeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 3h15M6 3v10l-3 7h18l-3-7V3" />
    <line x1="6" y1="11" x2="18" y2="11" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const BarChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);
const QrScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="3" height="3" />
    <line x1="21" y1="14" x2="21" y2="21" /><line x1="14" y1="21" x2="21" y2="21" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `lb-sidebar-nav-item${isActive ? " active" : ""}`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="lb-sidebar">
      {/* Logo */}
      <div className="lb-sidebar-logo">
        <div className="lb-logo-dot">🧪</div>
        <div>
          <div className="lb-logo-text">NexusCare</div>
          <div className="lb-logo-sub">Lab Portal</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="lb-sidebar-nav">
        <div className="lb-sidebar-section-label">Overview</div>
        <NavItem to="/" icon={<DashIcon />} label="Dashboard" />

        <div className="lb-sidebar-section-label" style={{ marginTop: 8 }}>Lab Operations</div>
        <NavItem to="/operations/patient-lookup" icon={<QrScanIcon />} label="Scan QR / Search" />
        <NavItem to="/operations/upload" icon={<UploadIcon />} label="Upload Reports" />

        <div className="lb-sidebar-section-label" style={{ marginTop: 8 }}>Settings</div>
        <NavItem to="/settings/availability" icon={<CalendarIcon />} label="Availability" />

        <div className="lb-sidebar-section-label" style={{ marginTop: 8 }}>Account</div>
        <NavItem to="/account/profile" icon={<UserIcon />} label="My Profile" />
      </div>

      {/* Bottom */}
      <div className="lb-sidebar-bottom">
        <div className="lb-sidebar-profile">
          <div className="lb-avatar">LB</div>
          <div style={{ minWidth: 0 }}>
            <div className="lb-profile-name" title={user?.email}>
              {user?.email || "Lab Staff"}
            </div>
            <div className="lb-profile-title">Lab Portal</div>
          </div>
        </div>
        <button className="lb-logout-btn" onClick={logout}>
          <LogoutIcon />
          Sign Out
        </button>
      </div>
    </aside>
  );
}