import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PortalLayout from "../components/PortalLayout";
import { apiFetch } from "../api/client";

function calcAge(dob) {
  if (!dob) return "—";
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

const APPT_STATUS_MAP = {
  Waiting: { label: "Waiting", cls: "badge-blue" },
  Ongoing: { label: "In Progress", cls: "badge-amber" },
  Conducted: { label: "Completed", cls: "badge-green" },
  "Not Conducted": { label: "Cancelled", cls: "badge-red" },
};

function Spinner() {
  return (
    <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "var(--p-text-dim)" }}>
      <div style={{ width: 40, height: 40, border: "3px solid var(--p-teal-light)", borderTop: "3px solid var(--p-teal)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span>Loading patient data…</span>
    </div>
  );
}

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("timeline");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await apiFetch(`/api/doctor/patient/${id}`);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <PortalLayout title="Patient Profile" subtitle={id}>
        <Spinner />
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout title="Patient Profile" subtitle={id}>
        <div className="p-card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h3 style={{ color: "var(--p-red)", marginBottom: 8 }}>Failed to load patient</h3>
          <p style={{ color: "var(--p-text-dim)", marginBottom: 24 }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </PortalLayout>
    );
  }

  const p = data?.patient || {};
  const appointments = data?.appointments || [];
  const prescriptions = data?.prescriptions || [];
  const labReports = data?.lab_reports || [];
  const medicalRecords = data?.medical_records || [];

  const allergies = p.allergies ? p.allergies.split(",").map(a => a.trim()).filter(Boolean) : [];

  // Build a combined timeline from medical records + appointments + prescriptions + labs
  const timeline = [
    ...medicalRecords.map(r => ({
      date: r.date,
      type: "diagnosis",
      title: `Diagnosis`,
      desc: r.diagnosis + (r.notes ? ` — ${r.notes}` : ""),
      color: "var(--p-red)",
      icon: "🩺",
    })),
    ...appointments.map(a => ({
      date: a.date,
      type: "appointment",
      title: `Appointment — ${APPT_STATUS_MAP[a.status]?.label || a.status}`,
      desc: `${a.time}`,
      color: "var(--p-blue)",
      icon: "📅",
    })),
    ...prescriptions.map(rx => ({
      date: rx.date,
      type: "prescription",
      title: `Prescription — ${rx.medicine_name}`,
      desc: `${rx.dosage}${rx.frequency ? ` · ${rx.frequency}` : ""}${rx.duration_days ? ` · ${rx.duration_days} days` : ""}`,
      color: "var(--p-purple)",
      icon: "💊",
    })),
    ...labReports.map(l => ({
      date: l.date,
      type: "lab",
      title: `Lab Report — ${l.test_name}`,
      desc: l.lab_report_id,
      color: "var(--p-amber)",
      icon: "🧪",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const initials = (p.name || "").split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <PortalLayout
      title="Patient Profile"
      subtitle={id}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate(`/doctor/consultation/${id}`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
            Add Consultation
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/doctor/prescriptions")}>📝 View Prescriptions</button>
          <button className="btn btn-secondary" onClick={() => navigate("/doctor/labs")}>🔬 Lab Reports</button>
        </div>
      }
    >
      <div className="grid-sidebar animate-in">
        {/* Left: Patient Info */}
        <div>
          <div className="p-card" style={{ textAlign: "center", marginBottom: 20 }}>
            <div className="avatar avatar-xl" style={{ margin: "0 auto 16px" }}>{initials}</div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>{p.name || "—"}</h2>
            <p style={{ margin: "0 0 12px", color: "var(--p-text-dim)", fontSize: 14 }}>
              {calcAge(p.dob)}y · {p.gender || "—"} · {p.blood_group || "Unknown blood group"}
            </p>
            <span className="badge badge-blue" style={{ fontSize: 13, padding: "5px 14px" }}>{id}</span>

            {/* Allergies */}
            {allergies.length > 0 && (
              <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--p-red-light)", borderRadius: 10, border: "1px solid rgba(239,68,68,.2)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--p-red)", marginBottom: 6 }}>⚠️ Allergies</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {allergies.map(a => <span key={a} className="badge badge-red">{a}</span>)}
                </div>
              </div>
            )}

            {/* Chronic conditions */}
            {p.chronic_conditions && (
              <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--p-amber-light)", borderRadius: 10, border: "1px solid rgba(245,158,11,.2)", textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#b45309", marginBottom: 4 }}>🏥 Chronic Conditions</div>
                <div style={{ fontSize: 13, color: "#92400e" }}>{p.chronic_conditions}</div>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="p-card">
            <h3 className="p-card-title" style={{ marginBottom: 16 }}>Contact Details</h3>
            {[
              { label: "NIC", value: p.nic },
              { label: "Date of Birth", value: p.dob },
              { label: "Phone", value: p.phone },
              { label: "Address", value: p.address },
            ].map(d => (
              <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--p-card-border)" }}>
                <span style={{ fontSize: 13, color: "var(--p-text-dim)", fontWeight: 600 }}>{d.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{d.value || "—"}</span>
              </div>
            ))}
            {p.emergency_contact_name && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: "#f0f9ff", borderRadius: 10, border: "1px solid rgba(59,130,246,.15)" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "var(--p-blue)", marginBottom: 4 }}>🆘 EMERGENCY CONTACT</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.emergency_contact_name}</div>
                <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>{p.emergency_contact_phone}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Tabs */}
        <div>
          <div className="p-card">
            <div className="p-tabs">
              {["timeline", "appointments", "prescriptions", "lab-reports"].map(t => (
                <button key={t} className={`p-tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                </button>
              ))}
            </div>

            {/* Timeline */}
            {activeTab === "timeline" && (
              timeline.length === 0
                ? <div className="empty-state"><h3>No history yet</h3><p>Medical activity will appear here.</p></div>
                : (
                  <div className="timeline">
                    {timeline.map((item, i) => (
                      <div className="timeline-item" key={i}>
                        <div className="timeline-dot" style={{ background: item.color, color: "#fff" }}>
                          <span style={{ fontSize: 10 }}>{item.icon}</span>
                        </div>
                        <div className="timeline-date">{item.date}</div>
                        <div className="timeline-content">
                          <h4>{item.title}</h4>
                          <p>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )}

            {/* Appointments */}
            {activeTab === "appointments" && (
              appointments.length === 0
                ? <div className="empty-state"><h3>No appointments</h3></div>
                : appointments.map((a, i) => (
                  <div key={a.appointment_id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < appointments.length - 1 ? "1px solid var(--p-card-border)" : "none" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--p-blue-light)", display: "grid", placeItems: "center", fontSize: 18 }}>📅</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.date} at {a.time}</div>
                      <div style={{ fontSize: 12, color: "var(--p-text-dim)" }}>{a.appointment_id}</div>
                    </div>
                    <span className={`badge ${APPT_STATUS_MAP[a.status]?.cls || "badge-blue"}`}>
                      {APPT_STATUS_MAP[a.status]?.label || a.status}
                    </span>
                  </div>
                ))
            )}

            {/* Prescriptions */}
            {activeTab === "prescriptions" && (
              prescriptions.length === 0
                ? <div className="empty-state"><h3>No prescriptions</h3></div>
                : prescriptions.map((rx, i) => (
                  <div key={rx.prescription_id} style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: 10, marginBottom: 10, border: "1px solid var(--p-card-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{rx.medicine_name}</span>
                      <span style={{ fontSize: 12, color: "var(--p-text-muted)" }}>{rx.date}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>
                      {rx.dosage}{rx.frequency ? ` · ${rx.frequency}` : ""}{rx.duration_days ? ` · ${rx.duration_days} days` : ""}
                    </div>
                  </div>
                ))
            )}

            {/* Lab Reports */}
            {activeTab === "lab-reports" && (
              labReports.length === 0
                ? <div className="empty-state"><h3>No lab reports</h3></div>
                : labReports.map((lab, i) => (
                  <div key={lab.lab_report_id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < labReports.length - 1 ? "1px solid var(--p-card-border)" : "none" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--p-amber-light)", display: "grid", placeItems: "center", fontSize: 18 }}>🧪</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{lab.test_name}</div>
                      <div style={{ fontSize: 12, color: "var(--p-text-dim)" }}>{lab.date}</div>
                    </div>
                    {lab.file_url
                      ? <a href={lab.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">📥 View</a>
                      : <span className="badge badge-amber">No File</span>
                    }
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}