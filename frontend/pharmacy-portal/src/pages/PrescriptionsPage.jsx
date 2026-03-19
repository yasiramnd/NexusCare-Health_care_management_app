import { useNavigate } from "react-router-dom";
import Prescriptions from "../components/Prescriptions";

export default function PrescriptionsPage() {
    const navigate = useNavigate();
    return <Prescriptions onBack={() => navigate("/pharmacy/dashboard")} />;
}
