import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";
import "../../styles/portal.css";

// ── Stat Icons ──────────────────────────────────────────────
const TotalIcon = ({ color = "#0ea5e9", size = 24 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="9" y="3" width="6" height="4" rx="1" stroke={color} strokeWidth="2" />
    <line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="9" y1="16" x2="13" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const PendingIcon = ({ color = "#f59e0b", size = 24 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ProgressIcon = ({ color = "#8b5cf6", size = 24 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M4.5 3h15M6 3v10l-3 7h18l-3-7V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="6" y1="11" x2="18" y2="11" stroke={color} strokeWidth="2" />
  </svg>
);
const DoneIcon = ({ color = "#10b981", size = 24 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Badge ──────────────────────────────────────────────────
function StatusBadge({ text }) {
  const t = (text || "").toLowerCase();
  const map = {
    pending: { bg: "#fef9c3", color: "#854d0e" },
    accepted: { bg: "#dbeafe", color: "#1e40af" },
    rejected: { bg: "#fee2e2", color: "#991b1b" },
    in_progress: { bg: "#ede9fe", color: "#5b21b6" },
    completed: { bg: "#d1fae5", color: "#065f46" },
    sent: { bg: "#ccfbf1", color: "#0f766e" },
  };
  const style = map[t] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, textTransform: "capitalize",
      background: style.bg, color: style.color
    }}>
      {text}
    </span>
  );
}

// ── Loading ──────────────────────────────────────────────────
function Loading({ label = "Loading..." }) {
  return (
    <div className="lb-loading">
      <div className="lb-spinner" />
      {label}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const { gate, message } = useLabGate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (gate !== "active") return;

    let mounted = true;
    async function load() {
      setBusy(true);
      try {
        const s = await api.get("/api/lab/stats");
        const r = await api.get("/api/lab/requests?status=all");
        if (!mounted) return;
        setStats(s.data);
        setRecent((r.data || []).slice(0, 5));
      } finally {
        if (mounted) setBusy(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [gate]);

  if (gate === "checking") return <Loading label="Checking lab access..." />;

  const statCards = [
    {
      label: "Total Requests",
      value: stats?.total ?? "—",
      icon: (s) => <TotalIcon color="#0ea5e9" size={s} />,
      iconBg: "#e0f2fe",
      trend: "All time",
    },
    {
      label: "Pending",
      value: stats?.pending ?? "—",
      icon: (s) => <PendingIcon color="#f59e0b" size={s} />,
      iconBg: "#fef9c3",
      trend: "Awaiting action",
    },
    {
      label: "In Progress",
      value: stats?.in_progress ?? "—",
      icon: (s) => <ProgressIcon color="#8b5cf6" size={s} />,
      iconBg: "#ede9fe",
      trend: "Being processed",
    },
    {
      label: "Completed",
      value: stats?.completed ?? "—",
      icon: (s) => <DoneIcon color="#10b981" size={s} />,
      iconBg: "#d1fae5",
      trend: "Finished",
    },
  ];

  return (
    <div>
      {/* ── Hero Banner ── */}
      <div className="lb-hero-banner">
        <div className="lb-hero-title">Good day, Lab Staff 👋</div>
        <div className="lb-hero-sub">
          Manage test requests, upload reports, and track lab performance.
        </div>

        {gate === "pending" && (
          <div className="lb-pending-notice">
            <div className="lb-pending-notice-title">⚠ Access Pending</div>
            <div className="lb-pending-notice-body">
              {message || "Waiting for admin approval."} You can view the
              dashboard but lab features are locked until approved.
            </div>
          </div>
        )}

        {gate === "error" && (
          <div className="lb-error-notice">
            <div className="lb-error-notice-title">Error</div>
            <div className="lb-error-notice-body">{message}</div>
          </div>
        )}
      </div>

      {/* ── Stats Grid ── */}
      <div className={`lb-stats-grid${gate !== "active" ? "" : ""}`}
        style={{ opacity: gate !== "active" ? 0.6 : 1 }}>
        {statCards.map((s) => (
          <div className="lb-stat-card" key={s.label}>
            <div className="lb-stat-icon-wrap" style={{ background: s.iconBg }}>
              {s.icon(28)}
            </div>
            <div className="lb-stat-value">{s.value}</div>
            <div className="lb-stat-label">{s.label}</div>
            <div className="lb-stat-trend">{s.trend}</div>
          </div>
        ))}
      </div>

      {/* ── Recent Requests Table ── */}
      <div className="lb-card">
        <div className="lb-card-header">
          <div className="lb-card-title">Recent Test Requests</div>
          <div className="lb-card-meta">Latest 5</div>
        </div>
        <div className="lb-card-body">
          {busy ? (
            <Loading />
          ) : recent.length === 0 ? (
            <div className="lb-table-empty">
              {gate === "active" ? "No requests yet" : "Locked until approved"}
            </div>
          ) : (
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Patient</th>
                  <th>Test</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row, i) => (
                  <tr key={row.id || i}>
                    <td style={{ fontWeight: 600, color: "var(--lb-text)" }}>{row.id}</td>
                    <td>{row.patient_name}</td>
                    <td>{row.test_name}</td>
                    <td>{row.priority}</td>
                    <td><StatusBadge text={row.status} /></td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}