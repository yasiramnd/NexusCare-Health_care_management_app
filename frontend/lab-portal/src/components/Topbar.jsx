import { useAuth } from "../context/AuthContext.jsx";
import "../styles/portal.css";

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="lb-topbar">
      <div>
        <div className="lb-topbar-title">{getGreeting()} 👋</div>
        <div className="lb-topbar-sub">Lab Dashboard — NexusCare</div>
      </div>

      <div className="lb-topbar-right">
        <div style={{ textAlign: "right" }}>
          <div className="lb-topbar-user-email">{user?.email || "Lab Staff"}</div>
          <div className="lb-topbar-user-role">Lab Portal</div>
        </div>
        <button className="lb-topbar-logout" onClick={logout}>
          <LogoutIcon />
          Sign Out
        </button>
      </div>
    </header>
  );
}