import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";
import { useOutletContext } from "react-router-dom";
import "./Profile.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const UserIcon = ({ size = 22, color = "#0284c7" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const EditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SaveIcon = ({ size = 16 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function getInitials(name) {
  if (!name) return "LB";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Profile() {
  const { gate, message } = useLabGate();
  const { toast } = useOutletContext();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({});

  useEffect(() => {
    if (gate !== "active") return;
    loadProfile();
  }, [gate]);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/lab/profile");
      const data = res.data;
      setProfile(data);
      setForm({
        lab_name: data.lab_name || "",
        phone: data.phone || "",
        address: data.address || "",
        reg_no: data.reg_no || "",
        license_no: data.license_no || "",
        available_tests: data.available_tests || ""
      });
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg("");
    try {
      await api.put("/api/lab/profile", form);
      toast.push("success", "Profile updated successfully ✅");
      setSuccessMsg("Profile updated successfully!");
      setEditing(false);
      await loadProfile();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
      toast.push("error", err?.response?.data?.error || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setError(null);
    setSuccessMsg("");
    if (profile) {
      setForm({
        lab_name: profile.lab_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        reg_no: profile.reg_no || "",
        license_no: profile.license_no || "",
        available_tests: profile.available_tests || ""
      });
    }
  }

  if (gate === "checking" || loading) {
    return (
      <div className="pp-page">
        <div className="pp-loading">
          <div className="pp-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (gate !== "active") {
    return (
      <div className="pp-page">
        <div className="pp-error-state">
          <p className="pp-error-text">Locked: {message || "Waiting for admin approval."}</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="pp-page">
        <div className="pp-error-state">
          <p className="pp-error-text">{error}</p>
          <button className="pp-btn pp-btn-primary" onClick={loadProfile}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-page">
      {/* Header */}
      <div className="pp-header">
        <div className="pp-header-left">
          <div className="pp-header-icon">
            <UserIcon size={22} color="var(--lb-blue, #0284c7)" />
          </div>
          <div>
            <h1 className="pp-title">Lab Profile</h1>
            <p className="pp-subtitle">Manage your lab information and settings</p>
          </div>
        </div>
        {!editing && (
          <button className="pp-btn pp-btn-outline" onClick={() => setEditing(true)}>
            <EditIcon size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="pp-alert pp-alert-success">{successMsg}</div>
      )}
      {error && profile && (
        <div className="pp-alert pp-alert-error">{error}</div>
      )}

      <div className="pp-content">
        {/* Profile Card */}
        <div className="pp-card pp-profile-card">
          <div className="pp-profile-top">
            <div className="pp-avatar-lg">{getInitials(profile.lab_name)}</div>
            <div className="pp-profile-info">
              <h2 className="pp-profile-name">{profile.lab_name || "Lab"}</h2>
              <span className="pp-pharmacy-id">{profile.lab_id}</span>
              <span className="pp-verification-badge approved">Approved</span>
            </div>
          </div>
          <div className="pp-profile-meta">
            <div className="pp-meta-item">
              <span className="pp-meta-label">License No</span>
              <span className="pp-meta-value">{profile.license_no || "—"}</span>
            </div>
            <div className="pp-meta-item">
              <span className="pp-meta-label">Business Reg. No</span>
              <span className="pp-meta-value">{profile.reg_no || "—"}</span>
            </div>
          </div>
        </div>

        {/* Editable Details */}
        <form className="pp-card pp-details-card" onSubmit={handleSave}>
          <div className="pp-card-header">
            <h3 className="pp-card-title">{editing ? "Edit Details" : "Contact & Information"}</h3>
          </div>

          <div className="pp-form-grid">
            <div className="pp-field">
              <label className="pp-label">Lab Name</label>
              {editing ? (
                <input className="pp-input" name="lab_name" value={form.lab_name} onChange={handleChange} />
              ) : (
                <div className="pp-value">{profile.lab_name || "—"}</div>
              )}
            </div>

            <div className="pp-field">
              <label className="pp-label">Phone</label>
              {editing ? (
                <input className="pp-input" name="phone" value={form.phone} onChange={handleChange} />
              ) : (
                <div className="pp-value">{profile.phone || "—"}</div>
              )}
            </div>

             <div className="pp-field">
              <label className="pp-label">Available Tests (Overview)</label>
              {editing ? (
                <input className="pp-input" name="available_tests" value={form.available_tests} onChange={handleChange} placeholder="e.g. General, Blood, Urine" />
              ) : (
                <div className="pp-value">{profile.available_tests || "—"}</div>
              )}
            </div>

            <div className="pp-field pp-field-full">
              <label className="pp-label">Address</label>
              {editing ? (
                <textarea className="pp-input pp-textarea" name="address" value={form.address} onChange={handleChange} rows={3} />
              ) : (
                <div className="pp-value">{profile.address || "—"}</div>
              )}
            </div>
          </div>

          {editing && (
            <div className="pp-form-actions">
              <button type="button" className="pp-btn pp-btn-secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="pp-btn pp-btn-primary" disabled={saving}>
                <SaveIcon size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}