import { useState, useEffect } from "react";
import PortalLayout from "../components/PortalLayout";
import { apiFetch } from "../api/client";

const DAYS = [
  { id: 0, label: "Sunday",    short: "Sun", color: "#8b5cf6" },
  { id: 1, label: "Monday",    short: "Mon", color: "#0d9488" },
  { id: 2, label: "Tuesday",   short: "Tue", color: "#0891b2" },
  { id: 3, label: "Wednesday", short: "Wed", color: "#3b82f6" },
  { id: 4, label: "Thursday",  short: "Thu", color: "#10b981" },
  { id: 5, label: "Friday",    short: "Fri", color: "#f59e0b" },
  { id: 6, label: "Saturday",  short: "Sat", color: "#ef4444" },
];

const TODAY_DOW = new Date().getDay(); // 0-6

function formatTime(t) {
  if (!t) return "–";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function SlotModal({ slot, onClose, onSave }) {
  const [form, setForm] = useState({
    day_of_week: slot?.day_of_week ?? 1,
    start_time: slot?.start_time?.slice(0, 5) ?? "09:00",
    end_time: slot?.end_time?.slice(0, 5) ?? "17:00",
    max_patients: slot?.max_patients ?? 10,
    location: slot?.location ?? "",
    consultation_fee: slot?.consultation_fee ?? "",
    is_active: slot?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const isEdit = !!slot?.availability_id;

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.start_time >= form.end_time) {
      setErr("End time must be after start time.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const payload = {
        ...form,
        day_of_week: Number(form.day_of_week),
        max_patients: Number(form.max_patients),
        consultation_fee: form.consultation_fee !== "" ? Number(form.consultation_fee) : null,
      };
      if (isEdit) {
        await apiFetch(`/api/doctor/availability/${slot.availability_id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/doctor/availability", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSave();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  }

  const selDay = DAYS.find(d => d.id === Number(form.day_of_week));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit ? "✏️ Edit Availability Slot" : "➕ Add Availability Slot"}
          </h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {err && (
              <div style={{ padding: "10px 16px", background: "var(--p-red-light)", borderRadius: 8, color: "var(--p-red)", marginBottom: 16, fontSize: 13 }}>
                ⚠️ {err}
              </div>
            )}

            {/* Day of Week */}
            <div className="p-field">
              <label className="p-label">Day of Week</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DAYS.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => set("day_of_week", d.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: Number(form.day_of_week) === d.id ? `2px solid ${d.color}` : "2px solid var(--p-input-border)",
                      background: Number(form.day_of_week) === d.id ? d.color + "18" : "var(--p-bg)",
                      color: Number(form.day_of_week) === d.id ? d.color : "var(--p-text-dim)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                  >
                    {d.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Times */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="p-field">
                <label className="p-label">Start Time</label>
                <input
                  type="time"
                  className="p-input"
                  value={form.start_time}
                  onChange={e => set("start_time", e.target.value)}
                  required
                />
              </div>
              <div className="p-field">
                <label className="p-label">End Time</label>
                <input
                  type="time"
                  className="p-input"
                  value={form.end_time}
                  onChange={e => set("end_time", e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="p-field">
                <label className="p-label">Max Patients per Slot</label>
                <input
                  type="number"
                  className="p-input"
                  value={form.max_patients}
                  onChange={e => set("max_patients", e.target.value)}
                  min={1}
                  max={100}
                  required
                />
              </div>
              <div className="p-field">
                <label className="p-label">Consultation Fee (LKR)</label>
                <input
                  type="number"
                  className="p-input"
                  value={form.consultation_fee}
                  onChange={e => set("consultation_fee", e.target.value)}
                  placeholder="Optional"
                  min={0}
                  step="0.01"
                />
              </div>
            </div>

            <div className="p-field">
              <label className="p-label">Location / Clinic Name</label>
              <input
                className="p-input"
                value={form.location}
                onChange={e => set("location", e.target.value)}
                placeholder="e.g. Main Clinic, Room 3, Colombo"
              />
            </div>

            <div className="p-field" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 0 }}>
              <div
                onClick={() => set("is_active", !form.is_active)}
                style={{
                  width: 44, height: 24, borderRadius: 99,
                  background: form.is_active ? "var(--p-teal)" : "var(--p-input-border)",
                  cursor: "pointer", position: "relative", transition: "background .2s",
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 3,
                  left: form.is_active ? "calc(100% - 21px)" : 3,
                  transition: "left .2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: form.is_active ? "var(--p-teal)" : "var(--p-text-dim)" }}>
                {form.is_active ? "Active – Accepting Appointments" : "Inactive – Not Accepting"}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ slot, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/api/doctor/availability/${slot.availability_id}`, { method: "DELETE" });
      onDelete();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  }

  const day = DAYS.find(d => d.id === slot.day_of_week);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3 className="modal-title">🗑️ Delete Slot</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 15, color: "var(--p-text-dim)", margin: 0 }}>
            Are you sure you want to delete the <strong>{day?.label}</strong> slot{" "}
            <strong>{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete Slot"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [modal, setModal] = useState(null); // null | { type: 'add'|'edit'|'delete', slot? }
  const [activeDay, setActiveDay] = useState(TODAY_DOW);

  async function loadSlots() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/doctor/availability");
      setSlots(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  const slotsByDay = DAYS.reduce((acc, d) => {
    acc[d.id] = slots.filter(s => s.day_of_week === d.id);
    return acc;
  }, {});

  const activeDaySlots = slotsByDay[activeDay] || [];
  const totalActive = slots.filter(s => s.is_active).length;
  const totalDays = new Set(slots.filter(s => s.is_active).map(s => s.day_of_week)).size;

  return (
    <PortalLayout
      title="My Availability"
      subtitle="Set your weekly consultation schedule"
      actions={
        <button
          id="add-availability-btn"
          className="btn btn-primary"
          onClick={() => setModal({ type: "add" })}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Slot
        </button>
      }
    >
      {/* Toast */}
      {successMsg && (
        <div style={{ padding: "12px 20px", background: "var(--p-green-light)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 10, marginBottom: 20, color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 20px", background: "var(--p-red-light)", borderRadius: 10, marginBottom: 20, color: "var(--p-red)" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="stat-grid animate-in" style={{ marginBottom: 28 }}>
        {[
          {
            label: "Active Slots",
            value: totalActive,
            icon: "🟢",
            color: "var(--p-green)",
            bg: "var(--p-green-light)",
            sub: "Currently accepting",
          },
          {
            label: "Working Days",
            value: totalDays,
            icon: "📅",
            color: "var(--p-teal)",
            bg: "var(--p-teal-light)",
            sub: "Per week",
          },
          {
            label: "Total Time Slots",
            value: slots.length,
            icon: "⏰",
            color: "var(--p-blue)",
            bg: "var(--p-blue-light)",
            sub: "All schedules",
          },
          {
            label: "Max Patients/Week",
            value: slots.filter(s => s.is_active).reduce((a, s) => a + (s.max_patients || 0), 0),
            icon: "👥",
            color: "var(--p-purple)",
            bg: "var(--p-purple-light)",
            sub: "Active slots total",
          },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ "--stat-color": s.color }}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color, fontSize: 22 }}>
              {s.icon}
            </div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 12, color: "var(--p-text-muted)", marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-sidebar animate-in delay-1">
        {/* Left: Day selector */}
        <div>
          <div className="p-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--p-card-border)" }}>
              <h3 className="p-card-title" style={{ margin: 0 }}>Weekly Schedule</h3>
            </div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {DAYS.map(d => {
                const daySlots = slotsByDay[d.id] || [];
                const isToday = d.id === TODAY_DOW;
                const isActive = activeDay === d.id;
                const hasSlots = daySlots.length > 0;
                const activeCount = daySlots.filter(s => s.is_active).length;
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveDay(d.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: isActive ? d.color + "18" : "transparent",
                      textAlign: "left",
                      transition: "background .15s",
                      outline: isActive ? `2px solid ${d.color}40` : "none",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: isActive ? d.color : hasSlots ? d.color + "22" : "var(--p-bg2)",
                      color: isActive ? "#fff" : hasSlots ? d.color : "var(--p-text-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 13, flexShrink: 0,
                      transition: "all .15s",
                    }}>
                      {d.short.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? d.color : "var(--p-text)" }}>
                          {d.label}
                        </span>
                        {isToday && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: d.color, color: "#fff", padding: "1px 6px", borderRadius: 99 }}>
                            TODAY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--p-text-muted)", marginTop: 1 }}>
                        {daySlots.length === 0
                          ? "No slots"
                          : `${activeCount} active, ${daySlots.length - activeCount} inactive`}
                      </div>
                    </div>
                    {hasSlots && (
                      <div style={{
                        minWidth: 22, height: 22, borderRadius: 99,
                        background: d.color, color: "#fff",
                        fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {daySlots.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Slot list for selected day */}
        <div>
          <div className="p-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              padding: "18px 24px",
              borderBottom: "1px solid var(--p-card-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: `linear-gradient(135deg, ${DAYS[activeDay].color}08, transparent)`,
            }}>
              <div>
                <h3 className="p-card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: DAYS[activeDay].color, display: "inline-block",
                  }} />
                  {DAYS[activeDay].label} Slots
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--p-text-dim)" }}>
                  {activeDaySlots.length === 0
                    ? "No availability set for this day"
                    : `${activeDaySlots.filter(s => s.is_active).length} of ${activeDaySlots.length} slots active`}
                </p>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setModal({ type: "add", slot: { day_of_week: activeDay } })}
                style={{ flexShrink: 0 }}
              >
                + Add
              </button>
            </div>

            {loading ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--p-text-dim)" }}>
                <div style={{ width: 36, height: 36, border: "3px solid var(--p-teal-light)", borderTop: "3px solid var(--p-teal)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Loading schedule…
              </div>
            ) : activeDaySlots.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                <h3>No Slots for {DAYS[activeDay].label}</h3>
                <p>Click "Add" to set your availability for this day.</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => setModal({ type: "add", slot: { day_of_week: activeDay } })}
                >
                  + Add {DAYS[activeDay].label} Slot
                </button>
              </div>
            ) : (
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                {activeDaySlots.map(slot => {
                  const dayColor = DAYS[activeDay].color;
                  return (
                    <div
                      key={slot.availability_id}
                      style={{
                        border: `1.5px solid ${slot.is_active ? dayColor + "30" : "var(--p-card-border)"}`,
                        borderRadius: 12,
                        padding: "16px 20px",
                        background: slot.is_active ? dayColor + "06" : "#fafafa",
                        position: "relative",
                        transition: "all .2s",
                      }}
                    >
                      {/* Status pill */}
                      <div style={{
                        position: "absolute",
                        top: 14, right: 16,
                        display: "flex", gap: 6,
                      }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                          background: slot.is_active ? "#d1fae5" : "#f1f5f9",
                          color: slot.is_active ? "#059669" : "#94a3b8",
                        }}>
                          {slot.is_active ? "● Active" : "○ Inactive"}
                        </span>
                      </div>

                      {/* Time Block */}
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                        <div style={{
                          padding: "10px 16px",
                          background: slot.is_active ? dayColor + "15" : "var(--p-bg2)",
                          borderRadius: 10,
                          textAlign: "center",
                          flexShrink: 0,
                        }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: slot.is_active ? dayColor : "var(--p-text-dim)", letterSpacing: -0.5 }}>
                            {formatTime(slot.start_time)}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--p-text-muted)", margin: "2px 0" }}>to</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: slot.is_active ? dayColor : "var(--p-text-dim)", letterSpacing: -0.5 }}>
                            {formatTime(slot.end_time)}
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontSize: 11, color: "var(--p-text-muted)", fontWeight: 600, marginBottom: 2 }}>MAX PATIENTS</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--p-text)" }}>👥 {slot.max_patients}</div>
                            </div>
                            {slot.consultation_fee != null && (
                              <div>
                                <div style={{ fontSize: 11, color: "var(--p-text-muted)", fontWeight: 600, marginBottom: 2 }}>FEE</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--p-green)" }}>💵 LKR {Number(slot.consultation_fee).toLocaleString()}</div>
                              </div>
                            )}
                            {slot.location && (
                              <div>
                                <div style={{ fontSize: 11, color: "var(--p-text-muted)", fontWeight: 600, marginBottom: 2 }}>LOCATION</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--p-text)" }}>📍 {slot.location}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, marginTop: 8, paddingTop: 12, borderTop: "1px solid var(--p-card-border)" }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setModal({ type: "edit", slot })}
                          style={{ flex: 1, justifyContent: "center" }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={async () => {
                            try {
                              await apiFetch(`/api/doctor/availability/${slot.availability_id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ is_active: !slot.is_active }),
                              });
                              await loadSlots();
                              showSuccess(slot.is_active ? "Slot deactivated." : "Slot activated!");
                            } catch (e) { alert(e.message); }
                          }}
                          style={{
                            flex: 1, justifyContent: "center",
                            background: slot.is_active ? "var(--p-amber-light)" : "var(--p-green-light)",
                            color: slot.is_active ? "#b45309" : "#059669",
                            border: slot.is_active ? "1px solid rgba(245,158,11,.2)" : "1px solid rgba(16,185,129,.2)",
                          }}
                        >
                          {slot.is_active ? "⏸ Deactivate" : "▶ Activate"}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setModal({ type: "delete", slot })}
                          style={{ flexShrink: 0 }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Overview Grid */}
          {!loading && slots.length > 0 && (
            <div className="p-card" style={{ marginTop: 20 }}>
              <h3 className="p-card-title" style={{ marginBottom: 16 }}>📋 Full Week Overview</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                {DAYS.map(d => {
                  const ds = slotsByDay[d.id] || [];
                  const active = ds.filter(s => s.is_active).length;
                  const isToday = d.id === TODAY_DOW;
                  const isSel = activeDay === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setActiveDay(d.id)}
                      style={{
                        padding: "10px 4px",
                        borderRadius: 10,
                        border: isSel ? `2px solid ${d.color}` : "2px solid transparent",
                        background: isToday ? d.color + "10" : "var(--p-bg)",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all .15s",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--p-text-muted)", marginBottom: 4 }}>
                        {d.short.toUpperCase()}
                      </div>
                      {ds.length > 0 ? (
                        <>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: d.color, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: 13, margin: "0 auto 4px",
                          }}>
                            {active}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--p-text-muted)" }}>slot{ds.length !== 1 ? "s" : ""}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 20, margin: "4px 0" }}>–</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {(modal?.type === "add" || modal?.type === "edit") && (
        <SlotModal
          slot={modal.slot}
          onClose={() => setModal(null)}
          onSave={async () => {
            setModal(null);
            await loadSlots();
            showSuccess(modal.type === "edit" ? "Slot updated successfully!" : "New slot added!");
          }}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirmModal
          slot={modal.slot}
          onClose={() => setModal(null)}
          onDelete={async () => {
            setModal(null);
            await loadSlots();
            showSuccess("Slot deleted.");
          }}
        />
      )}
    </PortalLayout>
  );
}
