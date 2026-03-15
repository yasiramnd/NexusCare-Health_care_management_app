import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import "./NormalOrders.css";

// ── Icons ──────────────────────────────────────────────────────────────────
const OrderIcon = ({ size = 22, color = "#3b82f6" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
    <path d="M8 10h8M8 14h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const InfoIcon = ({ color = "#3b82f6" }) => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckGreenIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Component ──────────────────────────────────────────────────────────────
export default function NormalOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/pharmacy/orders/normal");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPrepared(orderId) {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/api/pharmacy/orders/normal/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_prepared: true }),
      });
      setOrders(prev =>
        prev.map(o => (o.order_id === orderId ? { ...o, is_prepared: true } : o))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = orders.filter(o => !o.is_prepared).length;
  const preparedCount = orders.filter(o => o.is_prepared).length;
  const totalCount = orders.length;

  return (
    <div className="no-page-v2">
      {/* HEADER */}
      <div className="no-page-header">
        <div className="no-page-header-left">
          <div className="no-page-icon-wrap">
            <OrderIcon />
          </div>
          <div>
            <h1 className="no-page-title">Normal Orders</h1>
            <p className="no-page-desc">Manage and prepare regular prescription orders</p>
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="no-stats-row">
        <div className="no-stat-card-v2">
          <div className="no-stat-icon-v2" style={{ background: "#dbeafe" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#3b82f6" strokeWidth="2" /><path d="M8 10h8M8 14h5" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" /></svg>
          </div>
          <div className="no-stat-info">
            <div className="no-stat-num">{totalCount}</div>
            <div className="no-stat-label-v2">Total Orders</div>
          </div>
        </div>
        <div className="no-stat-card-v2">
          <div className="no-stat-icon-v2" style={{ background: "#fef3c7" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="2" /><path d="M12 7v5l3 3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="no-stat-info">
            <div className="no-stat-num">{pendingCount}</div>
            <div className="no-stat-label-v2">Pending</div>
          </div>
        </div>
        <div className="no-stat-card-v2">
          <div className="no-stat-icon-v2" style={{ background: "#d1fae5" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke="#059669" strokeWidth="2" /></svg>
          </div>
          <div className="no-stat-info">
            <div className="no-stat-num">{preparedCount}</div>
            <div className="no-stat-label-v2">Prepared</div>
          </div>
        </div>
      </div>

      {/* INFO BANNER */}
      {!loading && !error && pendingCount > 0 && (
        <div className="no-info-banner">
          <div className="no-info-icon-wrap">
            <InfoIcon color="#3b82f6" />
          </div>
          <div className="no-info-content">
            <div className="no-info-title">{pendingCount} order{pendingCount > 1 ? "s" : ""} pending preparation</div>
            <div className="no-info-sub">Review and mark orders as prepared when ready for pickup.</div>
          </div>
        </div>
      )}

      {!loading && !error && pendingCount === 0 && totalCount > 0 && (
        <div className="no-info-banner success">
          <div className="no-info-icon-wrap">
            <InfoIcon color="#10b981" />
          </div>
          <div className="no-info-content">
            <div className="no-info-title success">All orders prepared!</div>
            <div className="no-info-sub success">No pending normal orders at this time.</div>
          </div>
        </div>
      )}

      {/* LOADING / ERROR */}
      {loading && <div className="no-loading">Loading orders...</div>}
      {error && <div className="no-error">Error: {error}</div>}

      {/* EMPTY STATE */}
      {!loading && !error && totalCount === 0 && (
        <div className="no-info-banner">
          <div className="no-info-icon-wrap">
            <InfoIcon color="#3b82f6" />
          </div>
          <div className="no-info-content">
            <div className="no-info-title">No normal orders yet</div>
            <div className="no-info-sub">Normal orders will appear here once patients place them.</div>
          </div>
        </div>
      )}

      {/* ORDERS GRID */}
      {!loading && !error && (
        <div className="no-cards-grid">
          {orders.map(order => {
            const prepared = order.is_prepared;
            const initials = order.patient_name
              ? order.patient_name.split(" ").map(n => n[0]).join("").slice(0, 2)
              : "?";

            return (
              <div className={`no-card-v2 ${prepared ? "done" : ""}`} key={order.order_id}>
                {/* Status indicator line */}
                <div
                  className="no-card-status-line"
                  style={{ background: prepared ? "#10b981" : "#3b82f6" }}
                />

                {/* Card header */}
                <div className="no-card-header-v2">
                  <div className="no-card-patient">
                    <div
                      className="no-card-avatar"
                      style={{
                        background: prepared ? "#d1fae5" : "#dbeafe",
                        color: prepared ? "#065f46" : "#1d4ed8",
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div className="no-card-name">{order.patient_name}</div>
                      <div className="no-card-pid">{order.patient_id}</div>
                    </div>
                  </div>
                  <span
                    className="no-status-pill"
                    style={{
                      background: prepared ? "#d1fae5" : "#dbeafe",
                      color: prepared ? "#065f46" : "#1d4ed8",
                    }}
                  >
                    {prepared ? "Prepared" : "Pending"}
                  </span>
                </div>

                {/* Drug info */}
                <div className="no-card-drug-section">
                  <div className="no-card-drug-name">
                    {order.medicine_name || "Prescription " + order.prescription_id}
                  </div>
                  <div className="no-card-drug-details">
                    {order.dosage && (
                      <div className="no-card-detail-item">
                        <span className="no-detail-label">Dosage</span>
                        <span className="no-detail-value">{order.dosage}</span>
                      </div>
                    )}
                    {order.frequency && (
                      <div className="no-card-detail-item">
                        <span className="no-detail-label">Frequency</span>
                        <span className="no-detail-value">{order.frequency}</span>
                      </div>
                    )}
                    {order.duration_days && (
                      <div className="no-card-detail-item">
                        <span className="no-detail-label">Duration</span>
                        <span className="no-detail-value">{order.duration_days} days</span>
                      </div>
                    )}
                    <div className="no-card-detail-item">
                      <span className="no-detail-label">Total Price</span>
                      <span className="no-detail-value">Rs. {order.total_price}</span>
                    </div>
                  </div>
                </div>

                {/* Meta row */}
                <div className="no-card-meta-row">
                  <span>Order: {order.order_id}</span>
                  {order.contact_no && <span>📞 {order.contact_no}</span>}
                </div>

                {/* Action */}
                {!prepared && (
                  <div className="no-card-actions">
                    <button
                      className={`no-prepare-btn ${updatingId === order.order_id ? "updating" : ""}`}
                      onClick={() => handleMarkPrepared(order.order_id)}
                      disabled={updatingId === order.order_id}
                    >
                      {updatingId === order.order_id ? "Updating..." : "Mark as Prepared"}
                    </button>
                  </div>
                )}

                {prepared && (
                  <div className="no-done-row">
                    <div className="no-done-badge">
                      <CheckGreenIcon /> Order Prepared
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
