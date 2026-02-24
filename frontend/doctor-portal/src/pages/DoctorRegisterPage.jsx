import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DoctorRegisterPage() {
  const navigate = useNavigate();

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

    // basic validation
    const required = ["name", "contact_no1", "address", "nic_no", "specialization", "license_no"];
    const missing = required.filter((k) => !form[k].trim());
    if (missing.length > 0) {
      setErr(`Please fill: ${missing.join(", ")}`);
      return;
    }

    if (!certificateFile) {
      setErr("Please upload your certificate file.");
      return;
    }

    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const fd = new FormData();
      // user fields
      fd.append("name", form.name.trim());
      fd.append("contact_no1", form.contact_no1.trim());
      fd.append("contact_no2", form.contact_no2.trim());
      fd.append("address", form.address.trim());

      // doctor fields
      fd.append("nic_no", form.nic_no.trim());
      fd.append("gender", form.gender);
      fd.append("specialization", form.specialization.trim());
      fd.append("license_no", form.license_no.trim());

      // certificate file
      fd.append("certificate", certificateFile);

      const res = await fetch(`${base}/doctor/register-request`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data?.error || `Registration failed (${res.status})`);
        return;
      }

      setMsg("Registration request submitted! Please wait for admin approval.");
      // Optional: redirect to login after 2 seconds
      setTimeout(() => navigate("/doctor/login"), 1500);
    } catch (error) {
      setErr("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 720 }}>
      <h2>Doctor Registration</h2>
      <p style={{ opacity: 0.8 }}>
        Submit your details. Admin will verify and provide login credentials.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label>Full Name *</label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
              placeholder="Dr. John Silva"
            />
          </div>

          <div>
            <label>NIC No *</label>
            <input
              value={form.nic_no}
              onChange={(e) => updateField("nic_no", e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
              placeholder="XXXXXXXXXXXX"
            />
          </div>

          <div>
            <label>Contact No 1 *</label>
            <input
              value={form.contact_no1}
              onChange={(e) => updateField("contact_no1", e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
              placeholder="07XXXXXXXX"
            />
          </div>

          <div>
            <label>Contact No 2</label>
            <input
              value={form.contact_no2}
              onChange={(e) => updateField("contact_no2", e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
              placeholder="07XXXXXXXX"
            />
          </div>

          <div>
            <label>Gender *</label>
            <select
              value={form.gender}
              onChange={(e) => updateField("gender", e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label>Specialization *</label>
            <input
              value={form.specialization}
              onChange={(e) => updateField("specialization", e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
              placeholder="Cardiology"
            />
          </div>

          <div>
            <label>License No *</label>
            <input
              value={form.license_no}
              onChange={(e) => updateField("license_no", e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
              placeholder="SLMC-XXXX"
            />
          </div>

          <div>
            <label>Certificate (PDF/Image) *</label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label>Address *</label>
          <textarea
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6, minHeight: 90 }}
            placeholder="Clinic / Home address"
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "10px 16px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/doctor/login")}
            style={{ padding: "10px 16px" }}
          >
            Back to Login
          </button>
        </div>

        {err && <p style={{ marginTop: 12, color: "crimson" }}>{err}</p>}
        {msg && <p style={{ marginTop: 12, color: "green" }}>{msg}</p>}
      </form>
    </div>
  );
}