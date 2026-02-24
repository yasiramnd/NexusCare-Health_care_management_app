import { useNavigate } from "react-router-dom";

export default function DoctorDashboard() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    navigate("/doctor/login");
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Doctor Dashboard</h2>
      <p>Welcome to NexusCare Doctor Portal.</p>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={() => navigate("/doctor/scan")}>Scan Patient</button>
        <button onClick={() => navigate("/doctor/appointments")}>Appointments</button>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}