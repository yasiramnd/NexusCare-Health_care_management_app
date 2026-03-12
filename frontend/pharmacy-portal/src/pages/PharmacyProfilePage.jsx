import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import "./PharmacyProfile.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const UserIcon = ({ size = 22, color = "#059669" }) => (
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
  if (!name) return "PH";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function PharmacyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/pharmacy/me");
      setProfile(data);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        phone2: data.phone2 || "",
        address: data.address || "",
        available_date: data.available_date || "",
        available_time: data.available_time || "",
      });
    } catch (err) {
      setError(err.message);
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
      await apiFetch("/api/pharmacy/me", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setSuccessMsg("Profile updated successfully");
      setEditing(false);
      await loadProfile();
    } catch (err) {
      setError(err.message);
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
        name: profile.name || "",
        phone: profile.phone || "",
        phone2: profile.phone2 || "",
        address: profile.address || "",
        available_date: profile.available_date || "",
        available_time: profile.available_time || "",
      });
    }
  }

  if (loading) {
    return (
      <div className="pp-page">
        <div className="pp-loading">
          <div className="pp-spinner" />
          <p>Loading profile...</p>
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
            <UserIcon size={22} color="#059669" />
          </div>
          <div>
            <h1 className="pp-title">Pharmacy Profile</h1>
            <p className="pp-subtitle">Manage your pharmacy information and settings</p>
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
            <div className="pp-avatar-lg">{getInitials(profile.name)}</div>
            <div className="pp-profile-info">
              <h2 className="pp-profile-name">{profile.name}</h2>
              <span className="pp-pharmacy-id">{profile.pharmacy_id}</span>
              <span className={`pp-verification-badge ${profile.verification === "Approved" ? "approved" : "pending"}`}>
                {profile.verification}
              </span>
            </div>
          </div>
          <div className="pp-profile-meta">
            <div className="pp-meta-item">
              <span className="pp-meta-label">Email</span>
              <span className="pp-meta-value">{profile.email || "—"}</span>
            </div>
            <div className="pp-meta-item">
              <span className="pp-meta-label">License No</span>
              <span className="pp-meta-value">{profile.pharmacy_license_no || "—"}</span>
            </div>
            <div className="pp-meta-item">
              <span className="pp-meta-label">Business Reg. No</span>
              <span className="pp-meta-value">{profile.business_registration_number || "—"}</span>
            </div>
          </div>
        </div>

        {/* Editable Details */}
        <form className="pp-card pp-details-card" onSubmit={handleSave}>
          <div className="pp-card-header">
            <h3 className="pp-card-title">{editing ? "Edit Details" : "Contact & Availability"}</h3>
          </div>

          <div className="pp-form-grid">
            <div className="pp-field">
              <label className="pp-label">Pharmacy Name</label>
              {editing ? (
                <input className="pp-input" name="name" value={form.name} onChange={handleChange} />
              ) : (
                <div className="pp-value">{profile.name || "—"}</div>
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
              <label className="pp-label">Secondary Phone</label>
              {editing ? (
                <input className="pp-input" name="phone2" value={form.phone2} onChange={handleChange} />
              ) : (
                <div className="pp-value">{profile.phone2 || "—"}</div>
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

            <div className="pp-field">
              <label className="pp-label">Available Date</label>
              {editing ? (
                <input className="pp-input" type="date" name="available_date" value={form.available_date} onChange={handleChange} />
              ) : (
                <div className="pp-value">{profile.available_date || "—"}</div>
              )}
            </div>

            <div className="pp-field">
              <label className="pp-label">Available Time</label>
              {editing ? (
                <input className="pp-input" type="time" name="available_time" value={form.available_time} onChange={handleChange} />
              ) : (
                <div className="pp-value">{profile.available_time || "—"}</div>
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

        {/* Read-only Registration Info */}
        <div className="pp-card">
          <div className="pp-card-header">
            <h3 className="pp-card-title">Registration Documents</h3>
          </div>
          <div className="pp-form-grid">
            <div className="pp-field">
              <label className="pp-label">Pharmacy License No</label>
              <div className="pp-value">{profile.pharmacy_license_no || "—"}</div>
            </div>
            <div className="pp-field">
              <label className="pp-label">Business Registration No</label>
              <div className="pp-value">{profile.business_registration_number || "—"}</div>
            </div>
            {profile.business_registration_url && (
              <div className="pp-field pp-field-full">
                <label className="pp-label">Business Registration Document</label>
                <a className="pp-doc-link" href={profile.business_registration_url} target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
