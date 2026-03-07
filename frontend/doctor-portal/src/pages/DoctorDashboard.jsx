import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { apiFetch } from "../api/client";

const STATUS_MAP = {
  Waiting: { label: "Waiting", cls: "badge-blue" },
  Ongoing: { label: "In Progress", cls: "badge-amber" },
  Conducted: { label: "Completed", cls: "badge-green" },
  "Not Conducted": { label: "Cancelled", cls: "badge-red" },
};

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

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorName, setDoctorName] = useState("Doctor");

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [dash, profile] = await Promise.all([
          apiFetch("/api/doctor/dashboard"),
          apiFetch("/api/doctor/me"),
        ]);
        if (!cancelled) {
          setData(dash);
          const firstName = (profile.name || "Doctor").split(" ")[0];
          setDoctorName(firstName);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const stats = data?.stats || {};
  const todayAppts = data?.today_appointments || [];
  const pendingLabs = data?.pending_labs || [];

  return (
    <PortalLayout
      title="Dashboard"
      subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
    >
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Greeting Card */}
      <div className="p-card animate-in" style={{ background: "linear-gradient(135deg, #042f2e, #0c4a6e)", color: "#fff", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800 }}>
              {greeting()}, Dr. {doctorName} 👋
            </h2>
            <p style={{ margin: 0, opacity: .7, fontSize: 15 }}>
              {loading
                ? "Loading your schedule…"
                : error
                  ? "Could not load dashboard data"
                  : <>You have <strong>{stats.today_appointments ?? 0} appointments</strong> today. Let's make it a great day!</>
              }
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate("/doctor/patients")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              Patient Lookup
            </button>
            <button className="btn" style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.2)" }} onClick={() => navigate("/doctor/consultation")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
              New Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { label: "Today's Appointments", value: stats.today_appointments ?? "—", icon: "📅", color: "var(--p-blue)", bg: "var(--p-blue-light)", change: loading ? "" : `${stats.upcoming ?? 0} upcoming` },
          { label: "Patients Seen", value: stats.patients_seen_week ?? "—", icon: "👥", color: "var(--p-teal)", bg: "var(--p-teal-light)", change: "This week" },
          { label: "Lab Reports", value: stats.pending_labs ?? "—", icon: "🧪", color: "var(--p-amber)", bg: "var(--p-amber-light)", change: "Last 30 days" },
          { label: "Prescriptions", value: stats.prescriptions_month ?? "—", icon: "💊", color: "var(--p-purple)", bg: "var(--p-purple-light)", change: "This month" },
        ].map((s, i) => (
          <div className={`stat-card animate-in delay-${i + 1}`} key={s.label} style={{ "--stat-color": s.color }}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              {loading
                ? <Skeleton h={32} w={60} style={{ marginBottom: 6 }} />
                : <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              }
              <div className="stat-label">{s.label}</div>
              {!loading && <div className="stat-change up">{s.change}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Today's Appointments */}
        <div className="p-card animate-in delay-2">
          <div className="p-card-header">
            <h3 className="p-card-title">Today's Appointments</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate("/doctor/appointments")}>View All</button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} h={56} />)}
            </div>
          ) : error ? (
            <div className="empty-state"><p style={{ color: "var(--p-red)" }}>{error}</p></div>
          ) : todayAppts.length === 0 ? (
            <div className="empty-state">
              <h3>No appointments today</h3>
              <p>Enjoy your free day!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {todayAppts.map((apt) => {
                const statusConf = STATUS_MAP[apt.status] || { label: apt.status, cls: "badge-blue" };
                const initials = apt.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2);
                return (
                  <div
                    key={apt.appointment_id}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid var(--p-card-border)", cursor: "pointer", transition: "all .2s" }}
                    onClick={() => navigate(`/doctor/patient/${apt.patient_id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                  >
                    <div className="avatar-sm avatar">{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{apt.patient_name}</div>
                      <div style={{ fontSize: 12, color: "var(--p-text-dim)" }}>{apt.time} · {apt.patient_id}</div>
                    </div>
                    <span className={`badge ${statusConf.cls}`}>{statusConf.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Quick Actions */}
          <div className="p-card animate-in delay-3">
            <h3 className="p-card-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Scan QR", icon: "📷", path: "/doctor/patients", desc: "Patient lookup" },
                { label: "Prescriptions", icon: "📝", path: "/doctor/prescriptions", desc: "View Rx" },
                { label: "Lab Reports", icon: "🔬", path: "/doctor/labs", desc: "View results" },
                { label: "My Profile", icon: "⚙️", path: "/doctor/profile", desc: "View settings" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "18px 12px", background: "#f8fafc", border: "1px solid var(--p-card-border)", borderRadius: 12, cursor: "pointer", transition: "all .2s", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--p-teal-light)"; e.currentTarget.style.borderColor = "var(--p-teal)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "var(--p-card-border)"; }}
                >
                  <span style={{ fontSize: 28 }}>{a.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{a.label}</span>
                  <span style={{ fontSize: 11, color: "var(--p-text-dim)" }}>{a.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Lab Reports */}
          <div className="p-card animate-in delay-4">
            <div className="p-card-header">
              <h3 className="p-card-title">Recent Lab Reports</h3>
              <span className="badge badge-amber">{pendingLabs.length} report{pendingLabs.length !== 1 ? "s" : ""}</span>
            </div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} h={44} />)}
              </div>
            ) : pendingLabs.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                <p>No recent lab reports</p>
              </div>
            ) : (
              pendingLabs.map((lab, i) => (
                <div key={lab.lab_report_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < pendingLabs.length - 1 ? "1px solid var(--p-card-border)" : "none" }}>
                  <div className="avatar-sm avatar">{lab.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{lab.patient_name}</div>
                    <div style={{ fontSize: 12, color: "var(--p-text-dim)" }}>{lab.test_name}</div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--p-text-muted)" }}>{lab.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}