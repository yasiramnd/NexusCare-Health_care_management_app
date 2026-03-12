import { useNavigate } from "react-router-dom";
import ScanID from "../components/ScanID";

export default function ScanIDPage() {
    const navigate = useNavigate();
    return (
        <ScanID
            onBack={() => navigate("/pharmacy/dashboard")}
            onViewPrescriptions={(patientId) => navigate(`/pharmacy/prescriptions?patient=${patientId}`)}
        />
    );
}
