import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import "../styles/auth.css";

export default function PharmacyLoginPage() {
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMsg("");

        if (!identifier.trim() || !password) {
            setErrorMsg("Please enter your email and password.");
            return;
        }

        setLoading(true);
        try {
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    identifier: identifier.trim(),
                    password,
                }),
            });

            const token = data.token || data.access_token || data.jwt;
            const role = data.role;

            if (!token) {
                setErrorMsg("Login succeeded but token not found in response.");
                return;
            }

            if (role && role !== "PHARMACY") {
                setErrorMsg("This account is not a pharmacy account.");
                return;
            }

            localStorage.setItem("ph_access_token", token);
            if (data.refresh_token) localStorage.setItem("ph_refresh_token", data.refresh_token);
            if (role) localStorage.setItem("ph_role", role);
            if (data.user_id) localStorage.setItem("ph_user_id", data.user_id);

            navigate("/pharmacy/dashboard");
        } catch (err) {
            setErrorMsg(err.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="ph-auth-bg">
            <div className="ph-auth-card">
                {/* ─── LEFT ─── */}
                <div className="ph-auth-left">
                    <div className="ph-auth-brand">
                        <div className="ph-auth-badge">💊</div>
                        NexusCare
                    </div>

                    <h1 className="ph-auth-title">Welcome Back,<br />Pharmacist</h1>
                    <p className="ph-auth-sub">
                        Sign in to manage prescriptions, monitor inventory,
                        and fulfill patient orders — all from your secure portal.
                    </p>

                    <form className="ph-auth-form" onSubmit={handleSubmit}>
                        {/* Email */}
                        <div>
                            <div className="ph-auth-label">Email Address</div>
                            <div className="ph-auth-field ph-auth-field--has-icon">
                                <svg className="ph-auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <input
                                    id="ph-login-email"
                                    className="ph-auth-input"
                                    type="email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="pharmacy@example.com"
                                    aria-label="Email Address"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="ph-auth-label">Password</div>
                            <div className="ph-auth-field ph-auth-field--has-icon">
                                <svg className="ph-auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="ph-login-password"
                                    className="ph-auth-input"
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    aria-label="Password"
                                    autoComplete="current-password"
                                    style={{ paddingRight: 44 }}
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

                        <div className="ph-auth-row">
                            <span />
                            <a className="ph-auth-link" href="#">Forgot Password?</a>
                        </div>

                        <button id="ph-login-submit" className="ph-auth-btn" type="submit" disabled={loading}>
                            {loading ? "Signing in…" : "Sign In"}
                        </button>

                        {errorMsg && <div className="ph-auth-error">{errorMsg}</div>}

                        <div className="ph-auth-helper">
                            Don't have an account?{" "}
                            <Link className="ph-auth-link" to="/pharmacy/register">
                                Create Account
                            </Link>
                        </div>
                    </form>
                </div>

                {/* ─── RIGHT ─── */}
                <div className="ph-auth-right">
                    {/* Illustration */}
                    <div className="ph-auth-illustration">
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
                            <circle cx="60" cy="60" r="55" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" />
                            <circle cx="60" cy="60" r="40" stroke="rgba(52,211,153,0.2)" strokeWidth="1" />
                            {/* Pill shape */}
                            <rect x="35" y="50" width="50" height="22" rx="11" stroke="#34d399" strokeWidth="2" fill="none" />
                            <line x1="60" y1="50" x2="60" y2="72" stroke="#34d399" strokeWidth="2" />
                            <rect x="35" y="50" width="25" height="22" rx="11" fill="rgba(52,211,153,0.15)" />
                            {/* Plus sign */}
                            <path d="M60 30 V44 M53 37 H67" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                            {/* Dots */}
                            <circle cx="28" cy="45" r="3" fill="rgba(52,211,153,0.4)" />
                            <circle cx="92" cy="75" r="3" fill="rgba(52,211,153,0.3)" />
                            <circle cx="28" cy="75" r="2" fill="rgba(16,185,129,0.3)" />
                            <circle cx="92" cy="45" r="2" fill="rgba(16,185,129,0.35)" />
                        </svg>
                    </div>

                    <h2>
                        Smarter Pharmacy,<br />
                        Better <span>Patient Care</span>
                    </h2>

                    <div className="ph-auth-quote">
                        "Manage prescriptions digitally, track inventory in real-time, and
                        coordinate seamlessly with doctors and patients — all in one
                        secure platform."
                    </div>

                    <div className="ph-auth-person">
                        <div className="ph-auth-avatar">NC</div>
                        <div>
                            <div style={{ fontWeight: 800 }}>NexusCare Platform</div>
                            <small>Healthcare Management System</small>
                        </div>
                    </div>

                    <div className="ph-auth-logos">
                        <span className="ph-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
                            Secure Access
                        </span>
                        <span className="ph-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h3v1H5V7z" /></svg>
                            Prescriptions
                        </span>
                        <span className="ph-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 1h8l1 4H3l1-4zm-1 5h10v1H3V6zm1 2h8v6H4V8zm3 1v4h2V9H7z" /></svg>
                            Inventory
                        </span>
                        <span className="ph-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm-.5 2v4.5l3 1.5-.5 1-3.5-1.75V4h1z" /></svg>
                            Real-time
                        </span>
                        <span className="ph-auth-chip">
                            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L1 4v4c0 4.4 3 7.5 7 8 4-.5 7-3.6 7-8V4L8 1zm0 1.2L14 5v3c0 3.8-2.6 6.5-6 7-3.4-.5-6-3.2-6-7V5l6-2.8z" /></svg>
                            Role Based
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
