import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ToastHost from "./Toast";
import { useToast } from "../hooks/useToast";
import "../styles/portal.css";

export default function AppLayout() {
  const toast = useToast();

  return (
    <div className="lb-dash-root">
      <Sidebar />
      <div className="lb-main-area">
        <Topbar />
        <div className="lb-content">
          <div className="lb-page-body">
            <Outlet context={{ toast }} />
          </div>
        </div>
      </div>
      <ToastHost toasts={toast.toasts} remove={toast.remove} />
    </div>
  );
}