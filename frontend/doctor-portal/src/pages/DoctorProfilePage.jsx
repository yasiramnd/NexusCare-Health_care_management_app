import { useState, useEffect } from "react";
import PortalLayout from "../components/PortalLayout";
import { apiFetch } from "../api/client";

function Spinner() {
    return (
        <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "var(--p-text-dim)" }}>
            <div style={{ width: 40, height: 40, border: "3px solid var(--p-teal-light)", borderTop: "3px solid var(--p-teal)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span>Loading profile…</span>
        </div>
    );
}

export default function DoctorProfilePage() {
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [pwModal, setPwModal] = useState(false);
    const [oldPw, setOldPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const data = await apiFetch("/api/doctor/me");
                setProfile(data);
                setEditData({
                    name: data.name || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    specialization: data.specialization || "",
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleSave() {
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            await apiFetch("/api/doctor/me", {
                method: "PATCH",
                body: JSON.stringify(editData),
            });
            // Refresh profile
            const updated = await apiFetch("/api/doctor/me");
            setProfile(updated);
            setSuccessMsg("Profile updated successfully!");
            setEditing(false);
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            setError("Failed to save: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <PortalLayout title="My Profile" subtitle="Manage your account"><Spinner /></PortalLayout>;
    }

    const verification = profile?.verification || "Pending";
    const initials = (profile?.name || "DR").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <PortalLayout title="My Profile" subtitle="Manage your account">
            {successMsg && (
                <div style={{ padding: "12px 20px", background: "var(--p-green-light)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 10, marginBottom: 20, color: "#059669", fontWeight: 600 }}>
                    ✅ {successMsg}
                </div>
            )}
            {error && (
                <div style={{ padding: "12px 20px", background: "var(--p-red-light)", borderRadius: 10, marginBottom: 20, color: "var(--p-red)" }}>
                    ⚠️ {error}
                </div>
            )}

            <div className="grid-sidebar animate-in">
                {/* Left: Avatar & Status */}
                <div>
                    <div className="p-card" style={{ textAlign: "center", marginBottom: 20 }}>
                        <div className="avatar avatar-xl" style={{ margin: "0 auto 16px", fontSize: 28 }}>{initials}</div>
                        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>{profile?.name || "—"}</h2>
                        <p style={{ margin: "0 0 8px", color: "var(--p-text-dim)", fontSize: 14 }}>{profile?.specialization || "—"}</p>
                        <span className={`badge ${verification === "Approved" ? "badge-green" : verification === "Pending" ? "badge-amber" : "badge-red"}`}
                            style={{ fontSize: 13, padding: "5px 16px" }}>
                            {verification === "Approved" ? "✅" : verification === "Pending" ? "⏳" : "❌"} {verification}
                        </span>
                        <div style={{ marginTop: 20 }}>
                            <button className="btn btn-sm btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                                📷 Upload Photo
                            </button>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="p-card">
                        <h3 className="p-card-title" style={{ marginBottom: 16 }}>Quick Info</h3>
                        {[
                            { label: "License", value: profile?.license_no, icon: "🏥" },
                            { label: "Doctor ID", value: profile?.doctor_id, icon: "🆔" },
                            { label: "Email", value: profile?.email, icon: "✉️" },
                            { label: "NIC", value: profile?.nic, icon: "🪪" },
                        ].map(d => (
                            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--p-card-border)" }}>
                                <span style={{ fontSize: 20 }}>{d.icon}</span>
                                <div>
                                    <div style={{ fontSize: 12, color: "var(--p-text-muted)", fontWeight: 600 }}>{d.label}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.value || "—"}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Edit Form */}
                <div>
                    <div className="p-card">
                        <div className="p-card-header">
                            <h3 className="p-card-title">Profile Information</h3>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => setPwModal(true)}>🔒 Change Password</button>
                                <button
                                    className={`btn btn-sm ${editing ? "btn-primary" : "btn-secondary"}`}
                                    onClick={() => {
                                        if (editing) {
                                            handleSave();
                                        } else {
                                            setEditing(true);
                                        }
                                    }}
                                    disabled={saving}
                                >
                                    {saving ? "Saving…" : editing ? "Save Changes" : "✏️ Edit Profile"}
                                </button>
                                {editing && (
                                    <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(false); setEditData({ name: profile.name, phone: profile.phone, address: profile.address, specialization: profile.specialization }); }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {[
                                { label: "Full Name", field: "name", span: false },
                                { label: "Specialization", field: "specialization", span: false },
                                { label: "Phone", field: "phone", span: false },
                            ].map(f => (
                                <div key={f.field} className="p-field" style={f.span ? { gridColumn: "1 / -1" } : {}}>
                                    <label className="p-label">{f.label}</label>
                                    <input
                                        className="p-input"
                                        value={editData[f.field] || ""}
                                        onChange={e => setEditData(prev => ({ ...prev, [f.field]: e.target.value }))}
                                        disabled={!editing}
                                        style={{ opacity: editing ? 1 : .7, background: editing ? "#fff" : "#f8fafc" }}
                                    />
                                </div>
                            ))}
                            <div className="p-field" style={{ gridColumn: "1 / -1" }}>
                                <label className="p-label">Address</label>
                                <input
                                    className="p-input"
                                    value={editData.address || ""}
                                    onChange={e => setEditData(prev => ({ ...prev, address: e.target.value }))}
                                    disabled={!editing}
                                    style={{ opacity: editing ? 1 : .7, background: editing ? "#fff" : "#f8fafc" }}
                                />
                            </div>
                        </div>

                        {/* Read-only fields */}
                        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--p-card-border)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--p-text-muted)", marginBottom: 12, letterSpacing: 1 }}>READ-ONLY FIELDS</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                {[
                                    { label: "License Number", value: profile?.license_no },
                                    { label: "Doctor ID", value: profile?.doctor_id },
                                    { label: "NIC", value: profile?.nic },
                                    { label: "Gender", value: profile?.gender },
                                    { label: "Email", value: profile?.email },
                                ].map(f => (
                                    <div key={f.label} className="p-field">
                                        <label className="p-label">{f.label}</label>
                                        <input className="p-input" value={f.value || "—"} disabled style={{ opacity: .6, background: "#f8fafc" }} readOnly />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Verification Card */}
                    <div className="p-card" style={{ marginTop: 20 }}>
                        <h3 className="p-card-title" style={{ marginBottom: 16 }}>Verification Status</h3>
                        <div style={{
                            padding: 20, borderRadius: 12, textAlign: "center",
                            background: verification === "Approved" ? "var(--p-green-light)" : verification === "Pending" ? "var(--p-amber-light)" : "var(--p-red-light)",
                            border: `1px solid ${verification === "Approved" ? "rgba(16,185,129,.2)" : verification === "Pending" ? "rgba(245,158,11,.2)" : "rgba(239,68,68,.2)"}`,
                        }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>
                                {verification === "Approved" ? "✅" : verification === "Pending" ? "⏳" : "❌"}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: verification === "Approved" ? "#059669" : verification === "Pending" ? "#b45309" : "var(--p-red)" }}>
                                {verification === "Approved" ? "Account Verified" : verification === "Pending" ? "Verification Pending" : "Verification Rejected"}
                            </div>
                            <div style={{ fontSize: 14, color: "var(--p-text-dim)" }}>
                                {verification === "Approved"
                                    ? "Your account has been verified by the NexusCare admin team."
                                    : verification === "Pending"
                                        ? "Your documents are being reviewed. This usually takes 1–3 business days."
                                        : "Your verification was rejected. Please contact support."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {pwModal && (
                <div className="modal-overlay" onClick={() => setPwModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">🔒 Change Password</h3>
                            <button className="btn-icon" onClick={() => setPwModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ padding: "12px 16px", background: "var(--p-amber-light)", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#92400e" }}>
                                Password changes are managed via Firebase. Please use the "Forgot Password" flow on the login page to reset your password.
                            </div>
                            <div className="p-field">
                                <label className="p-label">Current Password</label>
                                <input className="p-input" type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Enter current password" />
                            </div>
                            <div className="p-field">
                                <label className="p-label">New Password</label>
                                <input className="p-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password" />
                            </div>
                            <div className="p-field">
                                <label className="p-label">Confirm New Password</label>
                                <input className="p-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter new password" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setPwModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => { alert("Password change via Firebase - feature coming soon."); setPwModal(false); }}>Update Password</button>
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
