import { useNavigate } from "react-router-dom";
import PriorityOrders from "../components/PriorityOrders";

export default function PriorityOrdersPage() {
    const navigate = useNavigate();
    return <PriorityOrders onBack={() => navigate("/pharmacy/dashboard")} />;
}
