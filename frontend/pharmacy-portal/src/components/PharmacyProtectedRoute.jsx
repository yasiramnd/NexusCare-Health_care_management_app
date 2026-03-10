import { Navigate } from "react-router-dom";
import { isPharmacyLoggedIn } from "../api/client";

export default function PharmacyProtectedRoute({ children }) {
    if (!isPharmacyLoggedIn()) {
        return <Navigate to="/pharmacy/login" replace />;
    }
    return children;
}
