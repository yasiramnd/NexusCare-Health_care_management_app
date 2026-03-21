import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useNavigate, Link } from "react-router-dom";
import { getApiBaseUrl } from "../../services/apiBase";
import "../../styles/auth.css";

export default function Login() {
  const nav = useNavigate();
  const apiBase = getApiBaseUrl();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onLogin(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      // Step 1: Sign in via Firebase (get ID token)
      await signInWithEmailAndPassword(auth, email, password);

      // Step 2: Call backend /auth/login to verify is_active (admin approval check)
      // This matches how doctor and pharmacy portals enforce approval
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Account not approved or wrong role — sign out of Firebase too
        await signOut(auth);
        setErr(data.error || "Login failed");
        return;
      }

      const data = await res.json().catch(() => ({}));

      // Enforce LAB role only
      if (data.role && data.role !== "LAB") {
        await signOut(auth);
        setErr("This account is not a lab account.");
        return;
      }

      // All checks passed — navigate to dashboard
      nav("/");
    } catch (e2) {
      // Sign out of Firebase if anything went wrong
      await signOut(auth).catch(() => { });
      setErr(e2?.message || "Login failed");
    } finally {
      setBusy(false);
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

          <h1 className="lb-auth-title">Welcome Back,<br />Lab Staff</h1>
          <p className="lb-auth-sub">
            Sign in to manage test requests, upload reports, and monitor
            lab activity — all from your secure portal.
          </p>

          <form className="lb-auth-form" onSubmit={onLogin}>
            {/* Email */}
            <div>
              <div className="lb-auth-label">Email Address</div>
              <div className="lb-auth-field lb-auth-field--has-icon">
                <svg className="lb-auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="lb-login-email"
                  className="lb-auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lab@example.com"
                  aria-label="Email Address"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="lb-auth-label">Password</div>
              <div className="lb-auth-field lb-auth-field--has-icon">
                <svg className="lb-auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="lb-login-password"
                  className="lb-auth-input"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  aria-label="Password"
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  className="lb-auth-pw-toggle"
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

            {err && <div className="lb-auth-error">{err}</div>}

            <button
              id="lb-login-submit"
              className="lb-auth-btn"
              type="submit"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign In"}
            </button>

            <div className="lb-auth-helper">
              Don't have an account?{" "}
              <Link className="lb-auth-link" to="/register">
                Create Account
              </Link>
            </div>
            <div style={{ fontSize: 11, color: "var(--lb-text-dim)", textAlign: "center", marginTop: 6 }}>
              After registration, wait for admin approval before logging in.
            </div>
          </form>
        </div>

        {/* ─── RIGHT ─── */}
        <div className="lb-auth-right">
          {/* Illustration */}
          <div className="lb-auth-illustration">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <circle cx="60" cy="60" r="55" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" />
              <circle cx="60" cy="60" r="40" stroke="rgba(56,189,248,0.2)" strokeWidth="1" />
              {/* Flask / beaker shape */}
              <path d="M48 38 L48 62 L38 80 C36 84 39 88 44 88 L76 88 C81 88 84 84 82 80 L72 62 L72 38 Z"
                stroke="#38bdf8" strokeWidth="2" fill="none" />
              <line x1="44" y1="48" x2="76" y2="48" stroke="#38bdf8" strokeWidth="2" />
              {/* Liquid fill */}
              <path d="M42 72 L38 80 C36 84 39 88 44 88 L76 88 C81 88 84 84 82 80 L78 72 Z"
                fill="rgba(14,165,233,0.2)" />
              {/* Bubbles */}
              <circle cx="54" cy="76" r="3" fill="rgba(56,189,248,0.5)" />
              <circle cx="64" cy="80" r="2" fill="rgba(56,189,248,0.4)" />
              <circle cx="70" cy="74" r="2.5" fill="rgba(14,165,233,0.4)" />
              {/* Plus sign */}
              <path d="M55 28 V35 M51.5 31.5 H58.5" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
              {/* Dots */}
              <circle cx="28" cy="50" r="3" fill="rgba(56,189,248,0.4)" />
              <circle cx="92" cy="70" r="3" fill="rgba(56,189,248,0.3)" />
              <circle cx="28" cy="72" r="2" fill="rgba(14,165,233,0.3)" />
              <circle cx="92" cy="48" r="2" fill="rgba(14,165,233,0.35)" />
            </svg>
          </div>

          <h2>
            Precision Lab,<br />
            Better <span>Patient Outcomes</span>
          </h2>

          <div className="lb-auth-quote">
            "Manage test requests digitally, upload reports instantly, and
            coordinate seamlessly with doctors and patients — all in one
            secure platform."
          </div>

          <div className="lb-auth-person">
            <div className="lb-auth-avatar">NC</div>
            <div>
              <div style={{ fontWeight: 800 }}>NexusCare Platform</div>
              <small>Healthcare Management System</small>
            </div>
          </div>

          <div className="lb-auth-logos">
            <span className="lb-auth-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>
              Secure Access
            </span>
            <span className="lb-auth-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h3v1H5V7z" /></svg>
              Lab Reports
            </span>
            <span className="lb-auth-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm-.5 2v4.5l3 1.5-.5 1-3.5-1.75V4h1z" /></svg>
              Real-time
            </span>
            <span className="lb-auth-chip">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L1 4v4c0 4.4 3 7.5 7 8 4-.5 7-3.6 7-8V4L8 1zm0 1.2L14 5v3c0 3.8-2.6 6.5-6 7-3.4-.5-6-3.2-6-7V5l6-2.8z" /></svg>
              Role Based
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}