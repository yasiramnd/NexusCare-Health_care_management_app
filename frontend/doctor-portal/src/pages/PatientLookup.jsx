import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

function SkeletonRow() {
    return (
        <tr><td colSpan={6}>
            <div style={{ height: 44, borderRadius: 6, background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", margin: "4px 0" }} />
        </td></tr>
    );
}

export default function PatientLookup() {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const [query, setQuery] = useState("");
    const [mode, setMode] = useState("search"); // search | scanning
    const [status, setStatus] = useState(null); // null | searching | found | error
    const [errorMsg, setErrorMsg] = useState("");
    const [recentPatients, setRecentPatients] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);

    useEffect(() => {
        inputRef.current?.focus();

        // Load recent patients
        async function loadRecent() {
            try {
                const data = await apiFetch("/api/doctor/recent-patients");
                setRecentPatients(data);
            } catch (_) {
                // silently ignore
            } finally {
                setLoadingRecent(false);
            }
        }
        loadRecent();
    }, []);

    async function handleSearch(e) {
        e?.preventDefault();
        const val = query.trim();
        if (!val) return;

        setStatus("searching");
        setErrorMsg("");

        try {
            const url = `/api/doctor/patients/by-qr?qr=${encodeURIComponent(val)}`;
            const data = await apiFetch(url);

            const patientId = data?.patient_id;
            if (!patientId) throw new Error("Patient ID not found in response");

            setStatus("found");
            setTimeout(() => navigate(`/doctor/patient/${patientId}`, { state: { data } }), 600);
        } catch (err) {
            setStatus("error");
            setErrorMsg(err.message || "Patient not found");
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleSearch();
    }

    return (
        <PortalLayout title="Patient Lookup" subtitle="Quick Patient Access">
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

            {/* Hero Search */}
            <div className="p-card animate-in" style={{
                background: "linear-gradient(135deg, #f0fdfa, #ecfeff)",
                border: "1px solid rgba(13,148,136,.15)", marginBottom: 28, textAlign: "center", padding: "48px 32px",
            }}>
                <div style={{ marginBottom: 8 }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--p-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                </div>
                <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: "#042f2e" }}>Quick Patient Lookup</h2>
                <p style={{ margin: "0 0 28px", color: "var(--p-text-dim)", fontSize: 15 }}>
                    Search by Patient ID, NIC, or QR code value
                </p>

                {/* Search Bar */}
                <div style={{ maxWidth: 600, margin: "0 auto" }}>
                    <div className="search-bar" style={{ borderColor: status === "error" ? "var(--p-red)" : undefined }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--p-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            ref={inputRef}
                            className="p-input"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter Patient ID, NIC, or QR value…"
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={handleSearch} disabled={status === "searching"}>
                            {status === "searching" ? "Searching…" : "Search"}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setMode("scanning")} title="Scan QR Code">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                            </svg>
                            Scan QR
                        </button>
                    </div>
                </div>

                {/* Status Messages */}
                {status === "found" && (
                    <div style={{ marginTop: 16, color: "var(--p-green)", fontWeight: 700, fontSize: 15 }}>
                        ✅ Patient found! Redirecting…
                    </div>
                )}
                {status === "error" && (
                    <div style={{ marginTop: 16, color: "var(--p-red)", fontWeight: 600, fontSize: 14, background: "var(--p-red-light)", display: "inline-block", padding: "8px 18px", borderRadius: 8 }}>
                        ❌ {errorMsg}
                    </div>
                )}
            </div>

            {/* Recent Patients */}
            <div className="p-card animate-in delay-1">
                <div className="p-card-header">
                    <h3 className="p-card-title">Recently Seen Patients</h3>
                    {!loadingRecent && <span className="badge badge-teal">{recentPatients.length} patients</span>}
                </div>
                <table className="p-table">
                    <thead>
                        <tr>
                            <th>Patient</th><th>Patient ID</th><th>NIC</th><th>Age / Gender</th><th>Last Visit</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingRecent
                            ? [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
                            : recentPatients.length === 0
                                ? (
                                    <tr><td colSpan={6}>
                                        <div className="empty-state">
                                            <h3>No recent patients</h3>
                                            <p>Patients you've seen will appear here.</p>
                                        </div>
                                    </td></tr>
                                )
                                : recentPatients.map(p => (
                                    <tr key={p.patient_id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div className="avatar-sm avatar">{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                                <span style={{ fontWeight: 600 }}>{p.name}</span>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-blue">{p.patient_id}</span></td>
                                        <td style={{ color: "var(--p-text-dim)", fontSize: 13 }}>{p.nic || "—"}</td>
                                        <td style={{ fontSize: 13 }}>{calcAge(p.dob)}y · {p.gender}</td>
                                        <td style={{ color: "var(--p-text-dim)", fontSize: 13 }}>{p.last_visit}</td>
                                        <td>
                                            <button className="btn btn-sm btn-primary" onClick={() => navigate(`/doctor/patient/${p.patient_id}`)}>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>
            </div>

            {/* QR Scanner Modal */}
            {mode === "scanning" && (
                <div className="modal-overlay" onClick={() => setMode("search")}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">📷 Scan QR Code</h3>
                            <button className="btn-icon" onClick={() => setMode("search")}>✕</button>
                        </div>
                        <div className="modal-body" style={{ textAlign: "center" }}>
                            <div style={{ width: "100%", height: 280, background: "#0a0a0a", borderRadius: 12, display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
                                <div style={{ width: 200, height: 200, border: "3px solid var(--p-teal)", borderRadius: 16, position: "relative" }}>
                                    <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: "var(--p-teal)", animation: "scanLine 2s infinite", boxShadow: "0 0 20px var(--p-teal)" }} />
                                </div>
                                <style>{`@keyframes scanLine { 0%,100% { top: 0; } 50% { top: calc(100% - 3px); } }`}</style>
                            </div>
                            <p style={{ marginTop: 16, color: "var(--p-text-dim)", fontSize: 14 }}>
                                Point your camera at the patient's QR code
                            </p>
                            <input
                                autoFocus
                                className="p-input"
                                placeholder="Or paste scanned value here…"
                                style={{ marginTop: 12 }}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && e.target.value.trim()) {
                                        setQuery(e.target.value.trim());
                                        setMode("search");
                                        handleSearch();
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
