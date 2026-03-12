import { useNavigate } from "react-router-dom";
import NormalOrders from "../components/NormalOrders";

export default function NormalOrdersPage() {
    const navigate = useNavigate();
    return <NormalOrders onBack={() => navigate("/pharmacy/dashboard")} />;
}
