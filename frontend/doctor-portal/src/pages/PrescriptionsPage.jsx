import { useState, useEffect } from "react";
import PortalLayout from "../components/PortalLayout";
import { apiFetch } from "../api/client";

function Skeleton({ h = 48 }) {
    return (
        <tr><td colSpan={6}>
            <div style={{ height: h, borderRadius: 6, background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", margin: "4px 0" }} />
        </td></tr>
    );
}

const STATUS_BADGE = {
    Issued: "badge-green",
    Ordered: "badge-amber",
    Taken: "badge-teal",
};

export default function PrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, this_month: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [detailRx, setDetailRx] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const data = await apiFetch("/api/doctor/prescriptions");
                if (!cancelled) {
                    setPrescriptions(data.prescriptions || []);
                    setStats(data.stats || {});
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

    const filtered = prescriptions.filter(rx => {
        if (filter === "all") return true;
        if (filter === "Issued") return rx.medications?.some(m => m.status === "Issued");
        if (filter === "completed") return rx.medications?.every(m => m.status !== "Issued");
        return true;
    });

    return (
        <PortalLayout title="Prescriptions" subtitle="Manage prescriptions">
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

            {/* Stats */}
            <div className="stat-grid animate-in" style={{ marginBottom: 24 }}>
                {[
                    { label: "Total Issued", value: loading ? "—" : stats.total, color: "var(--p-blue)", bg: "var(--p-blue-light)", icon: "📋" },
                    { label: "Active (Issued)", value: loading ? "—" : stats.active, color: "var(--p-green)", bg: "var(--p-green-light)", icon: "✅" },
                    { label: "This Month", value: loading ? "—" : stats.this_month, color: "var(--p-purple)", bg: "var(--p-purple-light)", icon: "📅" },
                ].map((s, i) => (
                    <div className={`stat-card delay-${i + 1}`} key={s.label} style={{ "--stat-color": s.color }}>
                        <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div>
                            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-card animate-in delay-2">
                {/* Filters */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                        {[
                            { key: "all", label: "All" },
                            { key: "Issued", label: "Active" },
                            { key: "completed", label: "Completed" },
                        ].map(f => (
                            <button key={f.key} className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(f.key)}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div style={{ padding: "12px 16px", background: "var(--p-red-light)", borderRadius: 8, color: "var(--p-red)", marginBottom: 16 }}>
                        ⚠️ {error}
                    </div>
                )}

                <table className="p-table">
                    <thead><tr><th>Rx ID</th><th>Patient</th><th>Date</th><th>Medications</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading
                            ? [1, 2, 3, 4].map(i => <Skeleton key={i} />)
                            : filtered.map(rx => {
                                const meds = rx.medications || [];
                                const allStatuses = meds.map(m => m.status);
                                const displayStatus = allStatuses.includes("Issued") ? "Issued" : allStatuses.includes("Ordered") ? "Ordered" : "Taken";
                                return (
                                    <tr key={rx.record_id}>
                                        <td><span className="badge badge-purple">{rx.record_id}</span></td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div className="avatar-sm avatar">{rx.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{rx.patient_name}</div>
                                                    <div style={{ fontSize: 12, color: "var(--p-text-muted)" }}>{rx.patient_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{rx.date}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                {meds.slice(0, 3).map((m, i) => (
                                                    <span key={i} className="badge badge-blue">{m.medicine_name}</span>
                                                ))}
                                                {meds.length > 3 && <span className="badge badge-blue">+{meds.length - 3} more</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${STATUS_BADGE[displayStatus] || "badge-teal"}`}>
                                                {displayStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button className="btn btn-sm btn-secondary" onClick={() => setDetailRx(rx)}>View</button>
                                                <button className="btn btn-sm btn-secondary" onClick={() => window.print()}>🖨️</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        }
                        {!loading && filtered.length === 0 && (
                            <tr><td colSpan={6}>
                                <div className="empty-state">
                                    <h3>No prescriptions found</h3>
                                    <p>Prescriptions you issue during consultations will appear here.</p>
                                </div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {detailRx && (
                <div className="modal-overlay" onClick={() => setDetailRx(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Prescription — {detailRx.record_id}</h3>
                            <button className="btn-icon" onClick={() => setDetailRx(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--p-card-border)" }}>
                                <div className="avatar">{detailRx.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{detailRx.patient_name}</div>
                                    <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>{detailRx.patient_id} · {detailRx.date}</div>
                                </div>
                            </div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--p-text-dim)", letterSpacing: 1 }}>MEDICATIONS</h4>
                            {(detailRx.medications || []).map((m, i) => (
                                <div key={i} style={{ padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid var(--p-card-border)", marginBottom: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{m.medicine_name}</div>
                                        <span className={`badge ${STATUS_BADGE[m.status] || "badge-teal"}`}>{m.status}</span>
                                    </div>
                                    <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>
                                        {m.dosage}{m.frequency ? ` · ${m.frequency}` : ""}{m.duration_days ? ` · ${m.duration_days} days` : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Print</button>
                            <button className="btn btn-secondary" onClick={() => setDetailRx(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
