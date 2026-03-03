import Sidebar from "./Sidebar";
import "../styles/portal.css";

export default function PortalLayout({ title, subtitle, actions, children }) {
    return (
        <div className="portal-layout">
            <Sidebar />
            <main className="portal-main">
                <header className="portal-topbar">
                    <h1 className="topbar-title">{title}</h1>
                    {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
                    <div className="topbar-spacer" />
                    {actions && <div className="topbar-actions">{actions}</div>}
                </header>
                <div className="portal-content">{children}</div>
            </main>
        </div>
    );
}
