import { useNavigate } from "react-router-dom";
import Availability from "../components/Availability";

export default function AvailabilityPage() {
    const navigate = useNavigate();
    return <Availability onBack={() => navigate("/pharmacy/dashboard")} />;
}
