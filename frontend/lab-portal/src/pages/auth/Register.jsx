import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/auth.css";

const Icon = ({ children, ...props }) => (
    <svg
        className="lb-auth-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        {children}
    </svg>
);

export default function Register() {
    const nav = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);

    const [form, setForm] = useState({
        lab_name: "",
        contact_no1: "",
        contact_no2: "",
        address: "",
        lab_license_no: "",
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

        const required = ["lab_name", "contact_no1", "address", "lab_license_no", "business_registration_number"];
        const missing = required.filter((k) => !String(form[k] || "").trim());
        if (missing.length) {
            setErr(`Please fill in: ${missing.map((k) => k.replace(/_/g, " ")).join(", ")}`);
            return;
        }

        if (!registrationFile) {
            setErr("Please upload your business registration document.");
            return;
        }

        setLoading(true);
        try {
            // Step 1: Create Firebase auth account
            const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const uid = credential.user.uid;

            const base = import.meta.env.VITE_API_BASE_URL ?? "";

            // Step 2: Store credentials in nexuscare_db_auth.credentials table
            const authRes = await fetch(`${base}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    password,               // backend will use this only if firebase_uid absent
                    firebase_uid: uid,      // already created — backend skips Firebase sign-up
                    role: "LAB",
                }),
            });

            if (!authRes.ok) {
                const authData = await authRes.json().catch(() => ({}));
                // If already registered that's fine (duplicate guard), else throw
                if (!authData.error?.includes("already registered")) {
                    throw new Error(authData.error || "Failed to save credentials");
                }
            }

            const authData = await authRes.json().catch(() => ({}));
            const userId = authData.user_id;

            // Step 3: Submit lab profile via FormData to backend
            const fd = new FormData();
            fd.append("user_id", userId || uid);
            fd.append("email", email.trim());
            fd.append("lab_name", form.lab_name.trim());
            fd.append("contact_no1", form.contact_no1.trim());
            fd.append("contact_no2", form.contact_no2.trim());
            fd.append("address", form.address.trim());
            fd.append("lab_license_no", form.lab_license_no.trim());
            fd.append("business_registration_number", form.business_registration_number.trim());
            fd.append("business_registration_doc", registrationFile);

            try {
                const profileRes = await fetch(`${base}/api/lab/register-request`, {
                    method: "POST",
                    body: fd,
                });
                if (!profileRes.ok) {
                    const d = await profileRes.json().catch(() => ({}));
                    console.warn("Lab profile submission:", d?.error || profileRes.status);
                }
            } catch {
                console.warn("Lab profile endpoint not yet available");
            }

            setMsg("Registration submitted! Credentials saved. Please wait for admin approval before logging in.");
            setTimeout(() => nav("/login"), 3500);
        } catch (error) {
            setErr(error.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="lb-auth-bg">
            <div className="lb-auth-card">
                {/* ─── LEFT ─── */}
                <div className="lb-auth-left">
                    <div className="lb-auth-brand">
                        <div className="lb-auth-badge">🧪</div>
                        NexusCare
                    </div>

                    <h1 className="lb-auth-title">Register Your Lab</h1>
                    <p className="lb-auth-sub">
                        Submit your laboratory details for verification. An admin will review
                        your credentials and grant portal access within 1–3 business days.
                    </p>

                    <form className="lb-auth-form" onSubmit={handleSubmit} style={{ maxWidth: 640 }}>

                        {/* ── Account Credentials ── */}
                        <div className="lb-auth-divider">Account Credentials</div>

                        <div className="lb-auth-grid2">
                            <div>
                                <div className="lb-auth-label">Email *</div>
                                <div className="lb-auth-field lb-auth-field--has-icon">
                                    <Icon>
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </Icon>
                                    <input
                                        id="lb-reg-email"
                                        className="lb-auth-input"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="lab@example.com"
                                        aria-label="Email"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="lb-auth-label">Password *</div>
                                <div className="lb-auth-field lb-auth-field--has-icon">
                                    <Icon>
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </Icon>
                                    <input
                                        id="lb-reg-password"
                                        className="lb-auth-input"
                                        type={showPw ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        aria-label="Password"
                                        autoComplete="new-password"
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        className="lb-auth-pw-toggle"
                                        onClick={() => setShowPw((v) => !v)}
                                        aria-label={showPw ? "Hide password" : "Show password"}
                                    >
                                        {showPw ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="lb-auth-label">Confirm Password *</div>
                                <div className="lb-auth-field lb-auth-field--has-icon">
                                    <Icon>
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </Icon>
                                    <input
                                        id="lb-reg-confirm-pw"
                                        className="lb-auth-input"
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

                        {/* ── Lab Information ── */}
                        <div className="lb-auth-divider">Lab Information</div>

                        <div className="lb-auth-grid2">
                            <div style={{ gridColumn: "1 / -1" }}>
                                <div className="lb-auth-label">Lab Name *</div>
                                <div className="lb-auth-field lb-auth-field--has-icon">
                                    <Icon>
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </Icon>
                                    <input
                                        id="lb-reg-name"
                                        className="lb-auth-input"
                                        value={form.lab_name}
                                        onChange={(e) => updateField("lab_name", e.target.value)}
                                        placeholder="City Diagnostics Laboratory"
                                        aria-label="Lab Name"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="lb-auth-label">Primary Contact *</div>
                                <div className="lb-auth-field lb-auth-field--has-icon">
                                    <Icon>
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 11.9 19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </Icon>
                                    <input
                                        id="lb-reg-phone1"
                                        className="lb-auth-input"
                                        value={form.contact_no1}
                                        onChange={(e) => updateField("contact_no1", e.target.value)}
                                        placeholder="07XXXXXXXX"
                                        aria-label="Primary Contact Number"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="lb-auth-label">Secondary Contact</div>
                                <div className="lb-auth-field lb-auth-field--has-icon">
                                    <Icon>
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 11.9 19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </Icon>
                                    <input
                                        id="lb-reg-phone2"
                                        className="lb-auth-input"
                                        value={form.contact_no2}
                                        onChange={(e) => updateField("contact_no2", e.target.value)}
                                        placeholder="07XXXXXXXX (optional)"
                                        aria-label="Secondary Contact Number"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── License & Registration ── */}
                        <div className="lb-auth-divider">License &amp; Registration</div>

                        <div className="lb-auth-grid2">
                            <div>
                                <div className="lb-auth-label">Lab License No *</div>
                                <div className="lb-auth-field lb-auth-field--has-icon">
                                    <Icon>
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                        <path d="M2 17l10 5 10-5" />
                                        <path d="M2 12l10 5 10-5" />
                                    </Icon>
                                    <input
                                        id="lb-reg-license"
                                        className="lb-auth-input"
                                        value={form.lab_license_no}
                                        onChange={(e) => updateField("lab_license_no", e.target.value)}
                                        placeholder="LAB-XXXX-XXXX"
                                        aria-label="Lab License Number"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="lb-auth-label">Business Reg. No *</div>
                                <div className="lb-auth-field lb-auth-field--has-icon">
                                    <Icon>
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <line x1="10" y1="9" x2="8" y2="9" />
                                    </Icon>
                                    <input
                                        id="lb-reg-brn"
                                        className="lb-auth-input"
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
                            <div className="lb-auth-label">Business Registration Document *</div>
                            <div className="lb-auth-upload-zone">
                                <input
                                    id="lb-reg-doc"
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setRegistrationFile(e.target.files?.[0] || null)}
                                    aria-label="Upload Business Registration Document"
                                />
                                <svg className="lb-auth-upload-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <div className="lb-auth-upload-text">
                                    <strong>Click to upload</strong> or drag and drop<br />
                                    PDF, PNG, JPG up to 20MB
                                </div>
                                {registrationFile && (
                                    <div className="lb-auth-upload-file">
                                        📄 {registrationFile.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <div className="lb-auth-label">Lab Address *</div>
                            <textarea
                                id="lb-reg-address"
                                className="lb-auth-textarea"
                                value={form.address}
                                onChange={(e) => updateField("address", e.target.value)}
                                placeholder="Full lab address including city"
                                aria-label="Lab Address"
                            />
                        </div>

                        <button id="lb-register-submit" className="lb-auth-btn" type="submit" disabled={loading}>
                            {loading ? "Submitting…" : "Submit Registration"}
                        </button>

                        {err && <div className="lb-auth-error">{err}</div>}
                        {msg && <div className="lb-auth-success">{msg}</div>}

                        <div className="lb-auth-helper">
                            Already have an account?{" "}
                            <Link className="lb-auth-link" to="/login">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>

                {/* ─── RIGHT ─── */}
                <div className="lb-auth-right">
                    {/* Shield + flask illustration */}
                    <div className="lb-auth-illustration">
                        <svg width="110" height="110" viewBox="0 0 120 120" fill="none" aria-hidden="true">
                            <path d="M60 10 L100 30 V65 C100 90 75 108 60 115 C45 108 20 90 20 65 V30 L60 10Z"
                                stroke="rgba(14,165,233,0.4)" strokeWidth="1.5" fill="none" />
                            <path d="M60 25 L90 40 V62 C90 82 70 96 60 102 C50 96 30 82 30 62 V40 L60 25Z"
                                stroke="rgba(56,189,248,0.25)" strokeWidth="1" fill="none" />
                            {/* Checkmark */}
                            <path d="M45 62 L55 72 L78 48" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            {/* Flask inside shield */}
                            <path d="M52 44 L52 56 L46 66 C45 68 46 70 48 70 L72 70 C74 70 75 68 74 66 L68 56 L68 44 Z"
                                stroke="#0ea5e9" strokeWidth="1.5" fill="none" opacity="0.6" />
                            <line x1="49" y1="50" x2="71" y2="50" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.5" />
                        </svg>
                    </div>

                    <h2>
                        Verified Lab,<br />
                        <span>Trusted Results</span>
                    </h2>

                    <div className="lb-auth-quote">
                        "Every laboratory is verified before gaining access. This protects
                        patient safety and ensures only certified labs process diagnostic
                        requests through NexusCare."
                    </div>

                    <div className="lb-auth-person">
                        <div className="lb-auth-avatar">AD</div>
                        <div>
                            <div style={{ fontWeight: 800 }}>Admin Verification</div>
                            <small>Role-based secure onboarding</small>
                        </div>
                    </div>

                    <div className="lb-auth-logos">
                        <span className="lb-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7S11.9 1 8 1zm0 1c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm-.5 2v4.5l3 1.5-.5 1-3.5-1.75V4h1z" /></svg>
                            Pending Review
                        </span>
                        <span className="lb-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3 1v14l5-3 5 3V1H3zm1 1h8v11l-4-2.4L4 13V2z" /></svg>
                            Document Upload
                        </span>
                        <span className="lb-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
                            Encrypted
                        </span>
                        <span className="lb-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L1 4v4c0 4.4 3 7.5 7 8 4-.5 7-3.6 7-8V4L8 1zm0 1.2L14 5v3c0 3.8-2.6 6.5-6 7-3.4-.5-6-3.2-6-7V5l6-2.8z" /></svg>
                            RBAC
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
