import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import "../styles/auth.css";

export default function DoctorLoginPage() {
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
      setErrorMsg("Please enter login and password.");
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

      if (role && role !== "DOCTOR") {
        setErrorMsg("This account is not a doctor account.");
        return;
      }

      localStorage.setItem("access_token", token);
      if (role) localStorage.setItem("role", role);
      if (data.user_id) localStorage.setItem("user_id", data.user_id);

      navigate("/doctor/dashboard");
    } catch (err) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth2-bg">
      <div className="auth2-card">
        {/* ─── LEFT ─── */}
        <div className="auth2-left">
          <div className="auth2-brand">
            <div className="auth2-badge">🩺</div>
            NexusCare
          </div>

          <h1 className="auth2-title">Welcome Back, Doctor</h1>
          <p className="auth2-sub">
            Sign in to access your dashboard — manage patients, appointments,
            prescriptions and lab reports, all in one place.
          </p>

          <form className="auth2-form" onSubmit={handleSubmit}>
            {/* Identifier */}
            <div>
              <div className="auth2-label">Email / User ID / Phone</div>
              <div className="auth2-field auth2-field--has-icon">
                <svg className="auth2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="login-identifier"
                  className="auth2-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your login"
                  aria-label="Email, User ID, or Phone"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="auth2-label">Password</div>
              <div className="auth2-field auth2-field--has-icon">
                <svg className="auth2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="login-password"
                  className="auth2-input"
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

            <div className="auth2-row">
              <span />
              <a className="auth2-link" href="#">
                Forgot Password?
              </a>
            </div>

            <button id="login-submit" className="auth2-btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

            {errorMsg && <div className="auth2-error">{errorMsg}</div>}

            <div className="auth2-helper">
              Don't have an account?{" "}
              <Link className="auth2-link" to="/doctor/register">
                Create Account
              </Link>
            </div>
          </form>
        </div>

        {/* ─── RIGHT ─── */}
        <div className="auth2-right">
          {/* Illustration */}
          <div className="auth2-illustration">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <circle cx="60" cy="60" r="55" stroke="rgba(13,148,136,0.3)" strokeWidth="1.5" />
              <circle cx="60" cy="60" r="40" stroke="rgba(6,182,212,0.2)" strokeWidth="1" />
              <path d="M60 25 L60 55 L80 55" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="60" cy="60" r="4" fill="#06b6d4" />
              {/* Heartbeat line */}
              <path d="M20 75 L40 75 L45 65 L50 85 L55 60 L60 80 L65 72 L100 72" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
              {/* Stethoscope head */}
              <circle cx="60" cy="38" r="8" stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.5" />
            </svg>
          </div>

          <h2>
            Modernize Healthcare
            <br />
            with <span>NexusCare</span>
          </h2>

          <div className="auth2-quote">
            "Access patient history instantly, issue digital prescriptions, and
            coordinate with labs and pharmacies — all from a single secure
            dashboard."
          </div>

          <div className="auth2-person">
            <div className="auth2-avatar">NC</div>
            <div>
              <div style={{ fontWeight: 800 }}>NexusCare Platform</div>
              <small>Healthcare Management System</small>
            </div>
          </div>

          <div className="auth2-logos">
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
              Secure Access
            </span>
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z" /></svg>
              QR Records
            </span>
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6 1v3H2v8h12V4h-4V1H6zm1 1h2v2H7V2zM3 5h10v6H3V5z" /></svg>
              Lab Integration
            </span>
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 1h8l1 4H3l1-4zm-1 5h10v1H3V6zm1 2h8v6H4V8zm3 1v4h2V9H7z" /></svg>
              Pharmacy Sync
            </span>
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm-.5 2v4.5l3 1.5-.5 1-3.5-1.75V4h1z" /></svg>
              Real-time
            </span>
            <span className="auth2-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L1 4v4c0 4.4 3 7.5 7 8 4-.5 7-3.6 7-8V4L8 1zm0 1.2L14 5v3c0 3.8-2.6 6.5-6 7-3.4-.5-6-3.2-6-7V5l6-2.8z" /></svg>
              Role Based
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}