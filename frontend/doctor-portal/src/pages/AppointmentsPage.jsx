import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { apiFetch } from "../api/client";

const STATUS_MAP = {
    Waiting: { label: "Waiting", cls: "badge-blue" },
    Ongoing: { label: "In Progress", cls: "badge-amber" },
    Conducted: { label: "Completed", cls: "badge-green" },
    "Not Conducted": { label: "Cancelled", cls: "badge-red" },
};

const FILTERS = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "Waiting", label: "Waiting" },
    { key: "Ongoing", label: "In Progress" },
    { key: "Conducted", label: "Completed" },
    { key: "Not Conducted", label: "Cancelled" },
];

function Skeleton({ h = 48 }) {
    return (
        <tr><td colSpan={5}>
            <div style={{ height: h, borderRadius: 6, background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", margin: "4px 0" }} />
        </td></tr>
    );
}

export default function AppointmentsPage() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [modal, setModal] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [saving, setSaving] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const rows = await apiFetch("/api/doctor/appointments");
            setAppointments(rows);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = appointments.filter(a => {
        if (filter === "all") return true;
        if (filter === "today") return a.date === today;
        return a.status === filter;
    });

    const todayAppts = appointments.filter(a => a.date === today);
    const todayDone = todayAppts.filter(a => a.status === "Conducted").length;

    function openModal(apt) {
        setModal(apt);
        setSelectedStatus(apt.status);
    }

    async function saveStatus() {
        if (!modal) return;
        setSaving(true);
        try {
            await apiFetch(`/api/doctor/appointments/${modal.appointment_id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: selectedStatus }),
            });
            setModal(null);
            await load();
        } catch (err) {
            alert("Failed to update: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    return (
        <PortalLayout title="Appointments" subtitle="Manage your schedule">
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

            {/* Today Highlight */}
            <div className="p-card animate-in" style={{ background: "linear-gradient(135deg, #eff6ff, #f0f9ff)", border: "1px solid rgba(59,130,246,.12)", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#1e3a5f" }}>📅 Today — {todayLabel}</h3>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--p-text-dim)" }}>
                            {loading
                                ? "Loading…"
                                : <>You have <strong>{todayAppts.length} appointments</strong> today · <strong>{todayDone} completed</strong> · <strong>{todayAppts.length - todayDone} remaining</strong></>
                            }
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ textAlign: "center", padding: "10px 20px", background: "var(--p-blue-light)", borderRadius: 10 }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--p-blue)" }}>{loading ? "—" : todayAppts.length}</div>
                            <div style={{ fontSize: 11, color: "var(--p-text-dim)", fontWeight: 600 }}>Total</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "10px 20px", background: "var(--p-green-light)", borderRadius: 10 }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--p-green)" }}>{loading ? "—" : todayDone}</div>
                            <div style={{ fontSize: 11, color: "var(--p-text-dim)", fontWeight: 600 }}>Done</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="p-card animate-in delay-1">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {FILTERS.map(f => (
                            <button key={f.key} className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(f.key)}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={load}>↻ Refresh</button>
                </div>

                {error && (
                    <div style={{ padding: "12px 16px", background: "var(--p-red-light)", borderRadius: 8, color: "var(--p-red)", marginBottom: 16 }}>
                        ⚠️ {error}
                    </div>
                )}

                <table className="p-table">
                    <thead>
                        <tr><th>Patient</th><th>Date & Time</th><th>Status</th><th>Paid</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {loading
                            ? [1, 2, 3, 4, 5].map(i => <Skeleton key={i} />)
                            : filtered.map(apt => (
                                <tr key={apt.appointment_id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div className="avatar-sm avatar">{apt.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{apt.patient_name}</div>
                                                <div style={{ fontSize: 12, color: "var(--p-text-muted)" }}>{apt.patient_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500, fontSize: 14 }}>{apt.date}</div>
                                        <div style={{ fontSize: 12, color: "var(--p-text-dim)" }}>{apt.time}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${STATUS_MAP[apt.status]?.cls || "badge-blue"}`}>
                                            {STATUS_MAP[apt.status]?.label || apt.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${apt.is_paid ? "badge-green" : "badge-amber"}`}>
                                            {apt.is_paid ? "Paid" : "Unpaid"}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="btn btn-sm btn-secondary" onClick={() => openModal(apt)}>Details</button>
                                            <button className="btn btn-sm btn-primary" onClick={() => navigate(`/doctor/patient/${apt.patient_id}`)}>View Patient</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        }
                        {!loading && filtered.length === 0 && (
                            <tr><td colSpan={5}>
                                <div className="empty-state">
                                    <h3>No appointments found</h3>
                                    <p>Try changing the filter above</p>
                                </div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Status Update Modal */}
            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Appointment Details</h3>
                            <button className="btn-icon" onClick={() => setModal(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                                <div className="avatar">{modal.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{modal.patient_name}</div>
                                    <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>{modal.patient_id} · {modal.date} at {modal.time}</div>
                                </div>
                            </div>

                            <div className="p-field">
                                <label className="p-label">Update Status</label>
                                <select className="p-select p-input" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                                    <option value="Waiting">Waiting</option>
                                    <option value="Ongoing">In Progress</option>
                                    <option value="Conducted">Completed</option>
                                    <option value="Not Conducted">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveStatus} disabled={saving}>
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
