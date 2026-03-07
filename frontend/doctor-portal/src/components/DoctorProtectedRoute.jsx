import { Navigate } from "react-router-dom";

export default function DoctorProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/doctor/login" replace />;
  return children;
}