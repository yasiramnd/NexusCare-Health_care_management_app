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

export default function LabReportsPage() {
    const [labReports, setLabReports] = useState([]);
    const [stats, setStats] = useState({ total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [detailLab, setDetailLab] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const data = await apiFetch("/api/doctor/lab-reports");
                if (!cancelled) {
                    setLabReports(data.lab_reports || []);
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

    // All lab_reports from backend are "completed" (they have a file_url)
    // Filter is cosmetic here — can be expanded when status field is added to schema
    const filtered = labReports;

    return (
        <PortalLayout title="Lab Reports" subtitle="Reports & Results">
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

            {/* Stats */}
            <div className="stat-grid animate-in" style={{ marginBottom: 24 }}>
                {[
                    { label: "Total Reports", value: loading ? "—" : stats.total, color: "var(--p-blue)", bg: "var(--p-blue-light)", icon: "🧪" },
                    { label: "This Month", value: loading ? "—" : labReports.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length, color: "var(--p-teal)", bg: "var(--p-teal-light)", icon: "📅" },
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

            {/* Table */}
            <div className="p-card animate-in delay-2">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                        {["all"].map(f => (
                            <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(f)}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
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
                    <thead><tr><th>Report ID</th><th>Patient</th><th>Test</th><th>Lab</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading
                            ? [1, 2, 3, 4, 5].map(i => <Skeleton key={i} />)
                            : filtered.map(lab => (
                                <tr key={lab.lab_report_id}>
                                    <td><span className="badge badge-blue">{lab.lab_report_id}</span></td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div className="avatar-sm avatar">{lab.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{lab.patient_name}</div>
                                                <div style={{ fontSize: 12, color: "var(--p-text-muted)" }}>{lab.patient_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 500, fontSize: 14 }}>{lab.test_name}</td>
                                    <td style={{ fontSize: 13, color: "var(--p-text-dim)" }}>{lab.lab_name || "—"}</td>
                                    <td style={{ fontSize: 13, color: "var(--p-text-dim)" }}>{lab.date}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="btn btn-sm btn-secondary" onClick={() => setDetailLab(lab)}>
                                                View Report
                                            </button>
                                            {lab.file_url && (
                                                <a href={lab.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                                                    📥 Download
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        }
                        {!loading && filtered.length === 0 && (
                            <tr><td colSpan={6}>
                                <div className="empty-state">
                                    <h3>No lab reports found</h3>
                                    <p>Lab reports uploaded for your patients will appear here.</p>
                                </div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {detailLab && (
                <div className="modal-overlay" onClick={() => setDetailLab(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Lab Report — {detailLab.lab_report_id}</h3>
                            <button className="btn-icon" onClick={() => setDetailLab(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                                <div className="avatar">{detailLab.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{detailLab.patient_name}</div>
                                    <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>{detailLab.patient_id} · {detailLab.date}</div>
                                </div>
                            </div>

                            <div style={{ padding: 16, background: "#f8fafc", borderRadius: 10, border: "1px solid var(--p-card-border)", marginBottom: 16 }}>
                                <div style={{ fontSize: 13, color: "var(--p-text-dim)", fontWeight: 600, marginBottom: 4 }}>TEST</div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{detailLab.test_name}</div>
                            </div>

                            {detailLab.lab_name && (
                                <div style={{ padding: 16, background: "#f8fafc", borderRadius: 10, border: "1px solid var(--p-card-border)", marginBottom: 16 }}>
                                    <div style={{ fontSize: 13, color: "var(--p-text-dim)", fontWeight: 600, marginBottom: 4 }}>LAB</div>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{detailLab.lab_name}</div>
                                </div>
                            )}

                            {detailLab.file_url ? (
                                <div style={{ padding: 16, background: "var(--p-green-light)", borderRadius: 10, border: "1px solid rgba(16,185,129,.2)", textAlign: "center" }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                                    <div style={{ fontWeight: 700, color: "#059669", marginBottom: 8 }}>Report Available</div>
                                    <a href={detailLab.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                        📥 Download Report
                                    </a>
                                </div>
                            ) : (
                                <div style={{ padding: 16, background: "var(--p-amber-light)", borderRadius: 10, border: "1px solid rgba(245,158,11,.2)", textAlign: "center" }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                                    <div style={{ fontWeight: 700, color: "#b45309" }}>File Not Available</div>
                                    <div style={{ fontSize: 13, color: "#92400e", marginTop: 4 }}>The file URL is not yet available for this report.</div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDetailLab(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
