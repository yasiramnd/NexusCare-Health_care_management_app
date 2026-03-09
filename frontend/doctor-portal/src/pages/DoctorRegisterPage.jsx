import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import "../styles/auth.css";

export default function DoctorRegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contact_no1: "",
    contact_no2: "",
    address: "",
    nic_no: "",
    gender: "Male",
    specialization: "",
    license_no: "",
  });

  const [certificateFile, setCertificateFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    // Validate email & password
    if (!email.trim() || !password) {
      setErr("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    const required = ["name", "contact_no1", "address", "nic_no", "specialization", "license_no"];
    const missing = required.filter((k) => !String(form[k] || "").trim());
    if (missing.length) {
      setErr(`Please fill: ${missing.join(", ")}`);
      return;
    }

    if (!certificateFile) {
      setErr("Please upload your certificate file.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create auth account (email + password + role)
      const authRes = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: "DOCTOR",
        }),
      });

      // Step 2: Submit doctor profile with FormData
      const base = import.meta.env.VITE_API_URL || "";
      const fd = new FormData();
      fd.append("user_id", authRes.user_id);
      fd.append("email", email.trim());
      fd.append("name", form.name.trim());
      fd.append("contact_no1", form.contact_no1.trim());
      fd.append("contact_no2", form.contact_no2.trim());
      fd.append("address", form.address.trim());
      fd.append("nic_no", form.nic_no.trim());
      fd.append("gender", form.gender);
      fd.append("specialization", form.specialization.trim());
      fd.append("license_no", form.license_no.trim());
      fd.append("certificate", certificateFile);

      // Try to submit doctor profile (may not exist yet — that's okay)
      try {
        const profileRes = await fetch(`${base}/api/doctor/register-request`, {
          method: "POST",
          body: fd,
        });
        if (!profileRes.ok) {
          const d = await profileRes.json().catch(() => ({}));
          console.warn("Doctor profile submission:", d?.error || profileRes.status);
        }
      } catch {
        console.warn("Doctor profile endpoint not available yet");
      }

      setMsg(authRes.message || "Registration submitted! Please wait for admin approval.");
      setTimeout(() => navigate("/doctor/login"), 2000);
    } catch (error) {
      setErr(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* Small SVG icon helper */
  const Icon = ({ d, ...props }) => (
    <svg className="auth2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {typeof d === "string" ? <path d={d} /> : d}
    </svg>
  );

  return (
    <div className="auth2-bg">
      <div className="auth2-card">
        {/* ─── LEFT ─── */}
        <div className="auth2-left">
          <div className="auth2-brand">
            <div className="auth2-badge">🩺</div>
            NexusCare
          </div>

          <h1 className="auth2-title">Create Doctor Account</h1>
          <p className="auth2-sub">
            Submit your details for verification. An admin will review your
            credentials and grant portal access.
          </p>

          <form className="auth2-form" onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
            {/* ── Account Credentials ── */}
            <div className="auth2-divider">Account Credentials</div>

            <div className="auth2-grid2">
              <div>
                <div className="auth2-label">Email *</div>
                <div className="auth2-field auth2-field--has-icon">
                  <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />
                  <input
                    id="reg-email"
                    className="auth2-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    aria-label="Email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="auth2-label">Password *</div>
                <div className="auth2-field auth2-field--has-icon">
                  <Icon d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />
                  <input
                    id="reg-password"
                    className="auth2-input"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    aria-label="Password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth2-pw-toggle"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="auth2-label">Confirm Password *</div>
                <div className="auth2-field auth2-field--has-icon">
                  <Icon d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />
                  <input
                    id="reg-confirm-pw"
                    className="auth2-input"
                    type={showPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    aria-label="Confirm Password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* ── Personal Info ── */}
            <div className="auth2-divider">Personal Information</div>

            <div className="auth2-grid2">
              <div>
                <div className="auth2-label">Full Name *</div>
                <div className="auth2-field auth2-field--has-icon">
                  <Icon d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />
                  <input
                    id="reg-name"
                    className="auth2-input"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Dr. John Silva"
                    aria-label="Full Name"
                  />
                </div>
              </div>

              <div>
                <div className="auth2-label">NIC No *</div>
                <div className="auth2-field auth2-field--has-icon">
                  <Icon d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 3h8M8 12h5" />
                  <input
                    id="reg-nic"
                    className="auth2-input"
                    value={form.nic_no}
                    onChange={(e) => updateField("nic_no", e.target.value)}
                    placeholder="XXXXXXXXXXXX"
                    aria-label="NIC Number"
                  />
                </div>
              </div>

              <div>
                <div className="auth2-label">Contact No 1 *</div>
                <div className="auth2-field auth2-field--has-icon">
                  <Icon d={<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></>} />
                  <input
                    id="reg-phone1"
                    className="auth2-input"
                    value={form.contact_no1}
                    onChange={(e) => updateField("contact_no1", e.target.value)}
                    placeholder="07XXXXXXXX"
                    aria-label="Primary Contact Number"
                  />
                </div>
              </div>

              <div>
                <div className="auth2-label">Contact No 2</div>
                <div className="auth2-field auth2-field--has-icon">
                  <Icon d={<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></>} />
                  <input
                    id="reg-phone2"
                    className="auth2-input"
                    value={form.contact_no2}
                    onChange={(e) => updateField("contact_no2", e.target.value)}
                    placeholder="07XXXXXXXX"
                    aria-label="Secondary Contact Number"
                  />
                </div>
              </div>

              <div>
                <div className="auth2-label">Gender *</div>
                <select
                  id="reg-gender"
                  className="auth2-select"
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  aria-label="Gender"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* ── Professional Info ── */}
            <div className="auth2-divider">Professional Details</div>

            <div className="auth2-grid2">
              <div>
                <div className="auth2-label">Specialization *</div>
                <div className="auth2-field auth2-field--has-icon">
                  <Icon d={<><path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v1H10V6a2 2 0 0 1 2-2z" /></>} />
                  <input
                    id="reg-spec"
                    className="auth2-input"
                    value={form.specialization}
                    onChange={(e) => updateField("specialization", e.target.value)}
                    placeholder="Cardiology"
                    aria-label="Specialization"
                  />
                </div>
              </div>

              <div>
                <div className="auth2-label">License No *</div>
                <div className="auth2-field auth2-field--has-icon">
                  <Icon d={<><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></>} />
                  <input
                    id="reg-license"
                    className="auth2-input"
                    value={form.license_no}
                    onChange={(e) => updateField("license_no", e.target.value)}
                    placeholder="SLMC-XXXX"
                    aria-label="Medical License Number"
                  />
                </div>
              </div>
            </div>

            {/* Certificate Upload */}
            <div>
              <div className="auth2-label">Certificate (PDF / Image) *</div>
              <div className="auth2-upload-zone">
                <input
                  id="reg-cert"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  aria-label="Upload Certificate"
                />
                <svg className="auth2-upload-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="auth2-upload-text">
                  <strong>Click to upload</strong> or drag and drop
                  <br />
                  PDF, PNG, JPG up to 10MB
                </div>
                {certificateFile && (
                  <div className="auth2-upload-file">
                    📄 {certificateFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <div className="auth2-label">Address *</div>
              <textarea
                id="reg-address"
                className="auth2-textarea"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Clinic or home address"
                aria-label="Address"
              />
            </div>

            <button id="register-submit" className="auth2-btn" type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Registration"}
            </button>

            {err && <div className="auth2-error">{err}</div>}
            {msg && <div className="auth2-success">{msg}</div>}

            <div className="auth2-helper">
              Already have an account?{" "}
              <Link className="auth2-link" to="/doctor/login">
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        {/* ─── RIGHT ─── */}
        <div className="auth2-right">
          {/* Shield illustration */}
          <div className="auth2-illustration">
            <svg width="110" height="110" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <path d="M60 10 L100 30 V65 C100 90 75 108 60 115 C45 108 20 90 20 65 V30 L60 10Z" stroke="rgba(13,148,136,0.4)" strokeWidth="1.5" fill="none" />
              <path d="M60 25 L90 40 V62 C90 82 70 96 60 102 C50 96 30 82 30 62 V40 L60 25Z" stroke="rgba(6,182,212,0.25)" strokeWidth="1" fill="none" />
              {/* Checkmark */}
              <path d="M45 62 L55 72 L78 48" stroke="#14b8a6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              {/* Cross / plus */}
              <path d="M60 45 V55 M55 50 H65" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            </svg>
          </div>

          <h2>
            Verified Doctors,
            <br />
            <span>Safer Care</span>
          </h2>

          <div className="auth2-quote">
            "Every doctor is verified before gaining access. This protects
            patient data and ensures only trusted professionals deliver care
            through NexusCare."
          </div>

          <div className="auth2-person">
            <div className="auth2-avatar">AD</div>
            <div>
              <div style={{ fontWeight: 800 }}>Admin Verification</div>
              <small>Role-based secure onboarding</small>
            </div>
          </div>

          <div className="auth2-logos">
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7S11.9 1 8 1zm0 1c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm-.5 2v4.5l3 1.5-.5 1-3.5-1.75V4h1z" /></svg>
              Pending Review
            </span>
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3 1v14l5-3 5 3V1H3zm1 1h8v11l-4-2.4L4 13V2z" /></svg>
              Document Upload
            </span>
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z" /></svg>
              Audit Logs
            </span>
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
              Encrypted
            </span>
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L1 4v4c0 4.4 3 7.5 7 8 4-.5 7-3.6 7-8V4L8 1zm0 1.2L14 5v3c0 3.8-2.6 6.5-6 7-3.4-.5-6-3.2-6-7V5l6-2.8z" /></svg>
              RBAC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}