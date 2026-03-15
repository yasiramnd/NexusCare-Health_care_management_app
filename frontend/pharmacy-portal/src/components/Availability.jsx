import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import "./Availability.css";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Icons ──────────────────────────────────────────────────────────────────
const ClockIcon = ({ size = 22, color = "#059669" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
const ToggleOnIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <rect x="1" y="5" width="22" height="14" rx="7" fill="#059669" />
    <circle cx="16" cy="12" r="5" fill="white" />
  </svg>
);
const ToggleOffIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <rect x="1" y="5" width="22" height="14" rx="7" fill="#cbd5e1" />
    <circle cx="8" cy="12" r="5" fill="white" />
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="#ef4444" strokeWidth="2" />
    <path d="M10 11v6M14 11v6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function Availability() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("17:00");

  useEffect(() => { fetchSlots(); }, []);

  async function fetchSlots() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/pharmacy/availability");
      setSlots(data.slots || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!formStart || !formEnd || formStart >= formEnd) return;
    setSaving(true);
    try {
      const data = await apiFetch("/api/pharmacy/availability", {
        method: "POST",
        body: JSON.stringify({ day_of_week: selectedDay, start_time: formStart, end_time: formEnd }),
      });
      setSlots(prev => [...prev, {
        availability_id: data.availability_id,
        day_of_week: selectedDay,
        start_time: formStart,
        end_time: formEnd,
        is_active: true,
      }]);
      setShowModal(false);
      setFormStart("09:00");
      setFormEnd("17:00");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(slot) {
    const newActive = !slot.is_active;
    try {
      await apiFetch(`/api/pharmacy/availability/${slot.availability_id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: newActive }),
      });
      setSlots(prev => prev.map(s =>
        s.availability_id === slot.availability_id ? { ...s, is_active: newActive } : s
      ));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(slot) {
    if (!confirm(`Delete ${DAYS[slot.day_of_week]} slot (${slot.start_time} - ${slot.end_time})?`)) return;
    try {
      await apiFetch(`/api/pharmacy/availability/${slot.availability_id}`, { method: "DELETE" });
      setSlots(prev => prev.filter(s => s.availability_id !== slot.availability_id));
    } catch (err) {
      alert(err.message);
    }
  }

  const daySlots = slots.filter(s => s.day_of_week === selectedDay);
  const slotCountByDay = DAYS.map((_, i) => slots.filter(s => s.day_of_week === i).length);

  return (
    <div className="av-page">
      {/* Header */}
      <div className="av-header">
        <div className="av-header-icon"><ClockIcon /></div>
        <div>
          <h1>Availability</h1>
          <p>Set your pharmacy's operating hours for each day</p>
        </div>
      </div>

      {loading ? (
        <div className="av-loading">Loading availability...</div>
      ) : error ? (
        <div className="av-error">{error}</div>
      ) : (
        <>
          {/* Day selector */}
          <div className="av-day-grid">
            {DAYS.map((day, i) => (
              <button
                key={i}
                className={`av-day-btn ${selectedDay === i ? "active" : ""}`}
                onClick={() => setSelectedDay(i)}
              >
                {DAY_SHORT[i]}
                <span className="av-day-count">
                  {slotCountByDay[i]} slot{slotCountByDay[i] !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>

          {/* Slots for selected day */}
          <div className="av-slots-header">
            <span className="av-slots-title">{DAYS[selectedDay]}</span>
            <button className="av-add-btn" onClick={() => setShowModal(true)}>
              <PlusIcon /> Add Slot
            </button>
          </div>

          <div className="av-slot-list">
            {daySlots.length === 0 ? (
              <div className="av-empty">
                <div className="av-empty-icon">📅</div>
                <div className="av-empty-title">No availability set</div>
                <div className="av-empty-text">Add a time slot for {DAYS[selectedDay]}</div>
              </div>
            ) : (
              daySlots.map(slot => (
                <div className="av-slot-card" key={slot.availability_id}>
                  <div className="av-slot-time-wrap">
                    {slot.start_time} <span className="av-slot-time-sep">–</span> {slot.end_time}
                  </div>
                  <span className={`av-slot-badge ${slot.is_active ? "active" : "inactive"}`}>
                    {slot.is_active ? "Active" : "Inactive"}
                  </span>
                  <div className="av-slot-actions">
                    <button className="av-slot-toggle" title="Toggle active" onClick={() => handleToggle(slot)}>
                      {slot.is_active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                    </button>
                    <button className="av-slot-del" title="Delete" onClick={() => handleDelete(slot)}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Add Slot Modal */}
      {showModal && (
        <div className="av-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="av-modal" onClick={e => e.stopPropagation()}>
            <h2>Add Availability Slot</h2>
            <div className="av-modal-row">
              <label>Day</label>
              <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="av-modal-row">
              <label>Start Time</label>
              <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} />
            </div>
            <div className="av-modal-row">
              <label>End Time</label>
              <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} />
            </div>
            <div className="av-modal-actions">
              <button className="av-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="av-modal-save"
                onClick={handleAdd}
                disabled={saving || !formStart || !formEnd || formStart >= formEnd}
              >
                {saving ? "Saving..." : "Add Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
