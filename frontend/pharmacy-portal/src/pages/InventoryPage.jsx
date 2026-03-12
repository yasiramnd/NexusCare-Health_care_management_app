import { useNavigate } from "react-router-dom";
import Inventory from "../components/Inventory";

export default function InventoryPage() {
    const navigate = useNavigate();
    return <Inventory onBack={() => navigate("/pharmacy/dashboard")} />;
}
