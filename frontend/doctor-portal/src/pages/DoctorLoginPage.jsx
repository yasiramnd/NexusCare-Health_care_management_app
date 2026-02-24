import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Link } from "react-router-dom";

export default function DoctorLoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // email / user_id / phone
  const [password, setPassword] = useState("");
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
          identifier: identifier.trim(), // could be email/user_id/phone
          password,
        }),
      });

      const token = data.token || data.access_token || data.jwt;
      const role = data.role;

      if (!token) {
        setErrorMsg("Login succeeded but token not found in response.");
        return;
      }

      // Optional: ensure doctor
      if (role && role !== "DOCTOR") {
        setErrorMsg("This account is not a doctor account.");
        return;
      }

      localStorage.setItem("access_token", token);
      if (role) localStorage.setItem("role", role);

      navigate("/doctor/dashboard"); // or "/doctor/scan"
    } catch (err) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h2>Doctor Login</h2>
      <p style={{ opacity: 0.8 }}>
        Login to access NexusCare Doctor Portal.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <label>Login (Email / User ID / Phone)</label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter your login"
          style={{ width: "100%", padding: 12, fontSize: 16, marginTop: 6 }}
        />

        <div style={{ height: 12 }} />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{ width: "100%", padding: 12, fontSize: 16, marginTop: 6 }}
        />

        <div style={{ height: 16 }} />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {errorMsg && (
          <p style={{ marginTop: 12, color: "crimson" }}>{errorMsg}</p>
        )}

        {errorMsg && (
  <p style={{ marginTop: 12, color: "crimson" }}>{errorMsg}</p>
)}

<p style={{ marginTop: 12 }}>
  New doctor?{" "}
  <Link to="/doctor/register">Register here</Link>
</p>
      </form>
    </div>
  );
}