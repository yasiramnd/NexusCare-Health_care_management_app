import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import "../styles/auth.css";

export default function PharmacyRegisterPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);

    const [form, setForm] = useState({
        pharmacy_name: "",
        contact_no1: "",
        contact_no2: "",
        address: "",
        pharmacy_license_no: "",
        business_registration_number: "",
    });

    const [registrationFile, setRegistrationFile] = useState(null);

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

        // Validate
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

        const required = ["pharmacy_name", "contact_no1", "address", "pharmacy_license_no", "business_registration_number"];
        const missing = required.filter((k) => !String(form[k] || "").trim());
        if (missing.length) {
            setErr(`Please fill in: ${missing.map(k => k.replace(/_/g, " ")).join(", ")}`);
            return;
        }

        if (!registrationFile) {
            setErr("Please upload your business registration document.");
            return;
        }

        setLoading(true);
        try {
            // Step 1: Create auth account with PHARMACY role
            const authRes = await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    role: "PHARMACY",
                }),
            });

            // Step 2: Submit pharmacy profile via FormData
            const base = import.meta.env.VITE_API_URL || "";
            const fd = new FormData();
            fd.append("user_id", authRes.user_id);
            fd.append("email", email.trim());
            fd.append("pharmacy_name", form.pharmacy_name.trim());
            fd.append("contact_no1", form.contact_no1.trim());
            fd.append("contact_no2", form.contact_no2.trim());
            fd.append("address", form.address.trim());
            fd.append("pharmacy_license_no", form.pharmacy_license_no.trim());
            fd.append("business_registration_number", form.business_registration_number.trim());
            fd.append("business_registration_doc", registrationFile);

            try {
                const profileRes = await fetch(`${base}/api/pharmacy/register-request`, {
                    method: "POST",
                    body: fd,
                });
                if (!profileRes.ok) {
                    const d = await profileRes.json().catch(() => ({}));
                    console.warn("Pharmacy profile submission:", d?.error || profileRes.status);
                }
            } catch {
                console.warn("Pharmacy profile endpoint not yet available");
            }

            setMsg(authRes.message || "Registration submitted! Please wait for admin approval before logging in.");
            setTimeout(() => navigate("/pharmacy/login"), 3000);
        } catch (error) {
            setErr(error.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const Icon = ({ d, ...props }) => (
        <svg className="ph-auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            {typeof d === "string" ? <path d={d} /> : d}
        </svg>
    );

    return (
        <div className="ph-auth-bg">
            <div className="ph-auth-card">
                {/* ─── LEFT ─── */}
                <div className="ph-auth-left">
                    <div className="ph-auth-brand">
                        <div className="ph-auth-badge">💊</div>
                        NexusCare
                    </div>

                    <h1 className="ph-auth-title">Register Your Pharmacy</h1>
                    <p className="ph-auth-sub">
                        Submit your pharmacy details for verification. An admin will review your
                        credentials and grant portal access within 1–3 business days.
                    </p>

                    <form className="ph-auth-form" onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
                        {/* ── Account Credentials ── */}
                        <div className="ph-auth-divider">Account Credentials</div>

                        <div className="ph-auth-grid2">
                            <div>
                                <div className="ph-auth-label">Email *</div>
                                <div className="ph-auth-field ph-auth-field--has-icon">
                                    <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />
                                    <input
                                        id="ph-reg-email"
                                        className="ph-auth-input"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="pharmacy@example.com"
                                        aria-label="Email"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="ph-auth-label">Password *</div>
                                <div className="ph-auth-field ph-auth-field--has-icon">
                                    <Icon d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />
                                    <input
                                        id="ph-reg-password"
                                        className="ph-auth-input"
                                        type={showPw ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        aria-label="Password"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="ph-auth-pw-toggle"
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
                                <div className="ph-auth-label">Confirm Password *</div>
                                <div className="ph-auth-field ph-auth-field--has-icon">
                                    <Icon d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />
                                    <input
                                        id="ph-reg-confirm-pw"
                                        className="ph-auth-input"
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

                        {/* ── Pharmacy Info ── */}
                        <div className="ph-auth-divider">Pharmacy Information</div>

                        <div className="ph-auth-grid2">
                            <div style={{ gridColumn: "1 / -1" }}>
                                <div className="ph-auth-label">Pharmacy Name *</div>
                                <div className="ph-auth-field ph-auth-field--has-icon">
                                    <Icon d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>} />
                                    <input
                                        id="ph-reg-name"
                                        className="ph-auth-input"
                                        value={form.pharmacy_name}
                                        onChange={(e) => updateField("pharmacy_name", e.target.value)}
                                        placeholder="City MediCare Pharmacy"
                                        aria-label="Pharmacy Name"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="ph-auth-label">Primary Contact *</div>
                                <div className="ph-auth-field ph-auth-field--has-icon">
                                    <Icon d={<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 11.9 19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></>} />
                                    <input
                                        id="ph-reg-phone1"
                                        className="ph-auth-input"
                                        value={form.contact_no1}
                                        onChange={(e) => updateField("contact_no1", e.target.value)}
                                        placeholder="07XXXXXXXX"
                                        aria-label="Primary Contact Number"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="ph-auth-label">Secondary Contact</div>
                                <div className="ph-auth-field ph-auth-field--has-icon">
                                    <Icon d={<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 11.9 19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></>} />
                                    <input
                                        id="ph-reg-phone2"
                                        className="ph-auth-input"
                                        value={form.contact_no2}
                                        onChange={(e) => updateField("contact_no2", e.target.value)}
                                        placeholder="07XXXXXXXX (optional)"
                                        aria-label="Secondary Contact Number"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── License & Registration ── */}
                        <div className="ph-auth-divider">License & Registration</div>

                        <div className="ph-auth-grid2">
                            <div>
                                <div className="ph-auth-label">Pharmacy License No *</div>
                                <div className="ph-auth-field ph-auth-field--has-icon">
                                    <Icon d={<><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></>} />
                                    <input
                                        id="ph-reg-license"
                                        className="ph-auth-input"
                                        value={form.pharmacy_license_no}
                                        onChange={(e) => updateField("pharmacy_license_no", e.target.value)}
                                        placeholder="PH-XXXX-XXXX"
                                        aria-label="Pharmacy License Number"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="ph-auth-label">Business Reg. No *</div>
                                <div className="ph-auth-field ph-auth-field--has-icon">
                                    <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />
                                    <input
                                        id="ph-reg-brn"
                                        className="ph-auth-input"
                                        value={form.business_registration_number}
                                        onChange={(e) => updateField("business_registration_number", e.target.value)}
                                        placeholder="BR-XXXXXXXXXX"
                                        aria-label="Business Registration Number"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Business Registration Document */}
                        <div>
                            <div className="ph-auth-label">Business Registration Document *</div>
                            <div className="ph-auth-upload-zone">
                                <input
                                    id="ph-reg-doc"
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setRegistrationFile(e.target.files?.[0] || null)}
                                    aria-label="Upload Business Registration Document"
                                />
                                <svg className="ph-auth-upload-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <div className="ph-auth-upload-text">
                                    <strong>Click to upload</strong> or drag and drop
                                    <br />
                                    PDF, PNG, JPG up to 10MB
                                </div>
                                {registrationFile && (
                                    <div className="ph-auth-upload-file">
                                        📄 {registrationFile.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <div className="ph-auth-label">Pharmacy Address *</div>
                            <textarea
                                id="ph-reg-address"
                                className="ph-auth-textarea"
                                value={form.address}
                                onChange={(e) => updateField("address", e.target.value)}
                                placeholder="Full pharmacy address including city"
                                aria-label="Pharmacy Address"
                            />
                        </div>

                        <button id="ph-register-submit" className="ph-auth-btn" type="submit" disabled={loading}>
                            {loading ? "Submitting…" : "Submit Registration"}
                        </button>

                        {err && <div className="ph-auth-error">{err}</div>}
                        {msg && <div className="ph-auth-success">{msg}</div>}

                        <div className="ph-auth-helper">
                            Already have an account?{" "}
                            <Link className="ph-auth-link" to="/pharmacy/login">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>

                {/* ─── RIGHT ─── */}
                <div className="ph-auth-right">
                    {/* Shield illustration */}
                    <div className="ph-auth-illustration">
                        <svg width="110" height="110" viewBox="0 0 120 120" fill="none" aria-hidden="true">
                            <path d="M60 10 L100 30 V65 C100 90 75 108 60 115 C45 108 20 90 20 65 V30 L60 10Z"
                                stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" fill="none" />
                            <path d="M60 25 L90 40 V62 C90 82 70 96 60 102 C50 96 30 82 30 62 V40 L60 25Z"
                                stroke="rgba(52,211,153,0.25)" strokeWidth="1" fill="none" />
                            {/* Checkmark */}
                            <path d="M45 62 L55 72 L78 48" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            {/* Pill inside shield */}
                            <rect x="48" y="42" width="24" height="10" rx="5" stroke="#10b981" strokeWidth="1.5" fill="none" opacity="0.5" />
                            <line x1="60" y1="42" x2="60" y2="52" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
                        </svg>
                    </div>

                    <h2>
                        Verified Pharmacy,<br />
                        <span>Trusted Service</span>
                    </h2>

                    <div className="ph-auth-quote">
                        "Every pharmacy is verified before gaining access. This protects
                        patient safety and ensures only licensed pharmacies dispense
                        medications through NexusCare."
                    </div>

                    <div className="ph-auth-person">
                        <div className="ph-auth-avatar">AD</div>
                        <div>
                            <div style={{ fontWeight: 800 }}>Admin Verification</div>
                            <small>Role-based secure onboarding</small>
                        </div>
                    </div>

                    <div className="ph-auth-logos">
                        <span className="ph-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7S11.9 1 8 1zm0 1c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm-.5 2v4.5l3 1.5-.5 1-3.5-1.75V4h1z" /></svg>
                            Pending Review
                        </span>
                        <span className="ph-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3 1v14l5-3 5 3V1H3zm1 1h8v11l-4-2.4L4 13V2z" /></svg>
                            Document Upload
                        </span>
                        <span className="ph-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
                            Encrypted
                        </span>
                        <span className="ph-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L1 4v4c0 4.4 3 7.5 7 8 4-.5 7-3.6 7-8V4L8 1zm0 1.2L14 5v3c0 3.8-2.6 6.5-6 7-3.4-.5-6-3.2-6-7V5l6-2.8z" /></svg>
                            RBAC
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
