import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../api/client";

const NAV_ITEMS = [
  {
    section: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", path: "/doctor/dashboard", icon: "dashboard" },
      { id: "patient-lookup", label: "Patient Lookup", path: "/doctor/patients", icon: "search", badge: "QR" },
    ],
  },
  {
    section: "Clinical",
    items: [
      { id: "appointments", label: "Appointments", path: "/doctor/appointments", icon: "calendar" },
      { id: "consultation", label: "Consultation", path: "/doctor/consultation", icon: "clipboard" },
      { id: "prescriptions", label: "Prescriptions", path: "/doctor/prescriptions", icon: "pill" },
      { id: "labs", label: "Lab Reports", path: "/doctor/labs", icon: "flask" },
    ],
  },
  {
    section: "Account",
    items: [
      { id: "availability", label: "My Availability", path: "/doctor/availability", icon: "clock" },
      { id: "profile", label: "My Profile", path: "/doctor/profile", icon: "user" },
    ],
  },
];

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  ),
  pill: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 1.5 8 8a4.95 4.95 0 0 1-7 7l-8-8a4.95 4.95 0 0 1 7-7z" /><path d="m8.5 8.5 7 7" />
    </svg>
  ),
  flask: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M12 3v7l-5 8.5a1 1 0 0 0 .85 1.5h8.3a1 1 0 0 0 .85-1.5L12 10V3" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [doctorInfo, setDoctorInfo] = useState({ name: "Loading...", specialization: "—" });
  const [pendingAppointments, setPendingAppointments] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiFetch("/api/doctor/me");
        setDoctorInfo({
          name: data.name || "Unknown Doctor",
          specialization: data.specialization || "General Physician"
        });
      } catch (err) {
        setDoctorInfo({ name: "Error Loading", specialization: "—" });
      }

      try {
        const rows = await apiFetch("/api/doctor/appointments");
        const today = new Date().toISOString().split("T")[0];
        const pending = rows.filter(a => a.date === today && a.status === "Waiting").length;
        setPendingAppointments(pending);
      } catch (err) {
        // silently fail for badge count if error
      }
    }
    loadData();
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    navigate("/doctor/login");
  }

  return (
    <aside className="portal-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🩺</div>
        <div>
          <div className="sidebar-brand-name">NexusCare</div>
          <div className="sidebar-brand-sub">Doctor Portal</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => (
              <button
                key={item.path}
                className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-icon">{ICONS[item.icon]}</span>
                {item.label}
                {item.id === "appointments" && pendingAppointments > 0 && (
                  <span className="sidebar-badge">{pendingAppointments}</span>
                )}
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-doctor-info">
          <div className="sidebar-doctor-avatar">
            {doctorInfo.name !== "Loading..." && doctorInfo.name !== "Error Loading"
              ? doctorInfo.name.replace("Dr.", "").trim().substring(0, 2).toUpperCase()
              : "DR"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-doctor-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {doctorInfo.name.toLowerCase().startsWith('dr') ? doctorInfo.name : `Dr. ${doctorInfo.name}`}
            </div>
            <div className="sidebar-doctor-role" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {doctorInfo.specialization}
            </div>
          </div>
        </div>
        <button
          className="sidebar-link"
          onClick={handleLogout}
          style={{ marginTop: 8, color: "#f87171" }}
        >
          <span className="sidebar-icon">{ICONS.logout}</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
