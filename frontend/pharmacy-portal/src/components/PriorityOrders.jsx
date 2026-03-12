import { useState } from "react";
import "./PriorityOrders.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const AlertPageIcon = ({ size = 22, color = "#059669" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill={color} />
  </svg>
);
const AlertCircleIcon = ({ color = "#f43f5e" }) => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill={color} />
  </svg>
);
const ClockIcon = ({ color = "#94a3b8" }) => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.72A2 2 0 012.18 1H5.18a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.92z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Data ───────────────────────────────────────────────────────────────────
const orders = [];

const priorityConfig = {
  "Critical": { bg: "#ef4444", color: "white", border: "#fca5a5", lightBg: "#fef2f2" },
  "High Priority": { bg: "#f97316", color: "white", border: "#fdba74", lightBg: "#fff7ed" },
  "Normal": { bg: "#3b82f6", color: "white", border: "#93c5fd", lightBg: "#eff6ff" },
};

// ── Component ──────────────────────────────────────────────────────────────
export default function PriorityOrders({ onBack }) {
  const [orderStatuses, setOrderStatuses] = useState(
    Object.fromEntries(orders.map(o => [o.id, o.status]))
  );

  const handleProcess = (id) => {
    setOrderStatuses(prev => ({ ...prev, [id]: "processing" }));
    setTimeout(() => {
      setOrderStatuses(prev => ({ ...prev, [id]: "done" }));
    }, 2000);
  };

  const urgentCount = orders.filter(o => orderStatuses[o.id] === "pending").length;
  const processingCount = orders.filter(o => orderStatuses[o.id] === "processing").length;
  const doneCount = orders.filter(o => orderStatuses[o.id] === "done").length;

  return (
    <div className="po-page-v2">
      {/* HEADER */}
      <div className="po-page-header">
        <div className="po-page-header-left">
          <div className="po-page-icon-wrap">
            <AlertPageIcon />
          </div>
          <div>
            <h1 className="po-page-title">Priority Orders</h1>
            <p className="po-page-desc">Action required for urgent prescriptions</p>
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="po-stats-row">
        <div className="po-stat-card-v2">
          <div className="po-stat-icon-v2" style={{ background: "#fee2e2" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="2" /><line x1="12" y1="8" x2="12" y2="12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="16" r="1" fill="#ef4444" /></svg>
          </div>
          <div className="po-stat-info">
            <div className="po-stat-num">{urgentCount}</div>
            <div className="po-stat-label-v2">Pending</div>
          </div>
        </div>
        <div className="po-stat-card-v2">
          <div className="po-stat-icon-v2" style={{ background: "#fef3c7" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="2" /><path d="M12 7v5l3 3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="po-stat-info">
            <div className="po-stat-num">{processingCount}</div>
            <div className="po-stat-label-v2">Processing</div>
          </div>
        </div>
        <div className="po-stat-card-v2">
          <div className="po-stat-icon-v2" style={{ background: "#d1fae5" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke="#059669" strokeWidth="2" /></svg>
          </div>
          <div className="po-stat-info">
            <div className="po-stat-num">{doneCount}</div>
            <div className="po-stat-label-v2">Completed</div>
          </div>
        </div>
      </div>

      {/* ALERT BANNER */}
      {urgentCount > 0 && (
        <div className="po-alert-banner-v2">
          <div className="po-alert-icon-wrap">
            <AlertCircleIcon color="#ef4444" />
          </div>
          <div className="po-alert-content">
            <div className="po-alert-title-v2">{urgentCount} urgent order{urgentCount > 1 ? "s" : ""} require attention</div>
            <div className="po-alert-sub-v2">These orders are time-sensitive. Please process immediately.</div>
          </div>
        </div>
      )}

      {urgentCount === 0 && (
        <div className="po-alert-banner-v2 success">
          <div className="po-alert-icon-wrap success">
            <AlertCircleIcon color="#10b981" />
          </div>
          <div className="po-alert-content">
            <div className="po-alert-title-v2 success">All orders processed!</div>
            <div className="po-alert-sub-v2 success">No pending priority orders at this time.</div>
          </div>
        </div>
      )}

      {/* ORDERS GRID */}
      <div className="po-cards-grid">
        {orders.map(order => {
          const pc = priorityConfig[order.priority];
          const status = orderStatuses[order.id];
          return (
            <div
              className={`po-card-v2 ${status === "done" ? "done" : ""}`}
              key={order.id}
            >
              {/* Priority indicator line */}
              <div className="po-card-priority-line" style={{ background: pc.bg }} />

              {/* Card top */}
              <div className="po-card-header-v2">
                <div className="po-card-patient">
                  <div className="po-card-avatar" style={{ background: pc.lightBg, color: pc.bg }}>
                    {order.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="po-card-name">{order.name}</div>
                    <div className="po-card-pid">{order.pid}</div>
                  </div>
                </div>
                <span
                  className="po-priority-pill"
                  style={{ background: status === "done" ? "#d1fae5" : pc.bg, color: status === "done" ? "#065f46" : pc.color }}
                >
                  {status === "done" ? "Completed" : order.priority}
                </span>
              </div>

              {/* Drug info */}
              <div className="po-card-drug-section">
                <div className="po-card-drug-name">{order.drug}</div>
                <div className="po-card-drug-details">
                  <div className="po-card-detail-item">
                    <span className="po-detail-label">Quantity</span>
                    <span className="po-detail-value">{order.quantity} {order.unit}</span>
                  </div>
                  <div className="po-card-detail-item">
                    <span className="po-detail-label">Due</span>
                    <span className="po-detail-value">{order.due}</span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="po-reason-row-v2">
                <AlertCircleIcon color="#f59e0b" />
                <div>
                  <div className="po-reason-label-v2">REASON</div>
                  <div className="po-reason-text-v2">{order.reason}</div>
                </div>
              </div>

              {/* Time */}
              <div className="po-meta-row-v2">
                <span className="po-time-v2"><ClockIcon /> Submitted {order.time}</span>
              </div>

              {/* Action */}
              {status !== "done" && (
                <div className="po-actions-v2">
                  <button
                    className={`po-process-btn-v2 ${status === "processing" ? "processing" : ""}`}
                    onClick={() => handleProcess(order.id)}
                    disabled={status === "processing"}
                  >
                    {status === "processing" ? "Processing..." : "Start Processing"}
                  </button>
                  <button className="po-icon-btn-v2"><PhoneIcon /></button>
                </div>
              )}

              {status === "done" && (
                <div className="po-done-row-v2">
                  <div className="po-done-badge-v2">
                    <CheckIcon /> Order Processed Successfully
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
