import { useEffect, useState } from "react";
import Loading from "../../components/Loading.jsx";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";
import { useOutletContext } from "react-router-dom";
import "../../styles/portal.css";

/* ── Icons ──────────────────────────────────────────────── */
const CalendarIcon = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
  </svg>
);
const ClockIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SaveIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17 21 17 13 7 13 7 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="7 3 7 8 15 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const NoteIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DAYS = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
];

/* ── Skeleton ──────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 18 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",
      backgroundSize: "200% 100%",
      animation: "lb-shimmer 1.5s infinite",
    }} />
  );
}

export default function Availability() {
  const { gate, message } = useLabGate();
  const { toast } = useOutletContext();

  const [schedule, setSchedule] = useState({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gate !== "active") return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/api/lab/availability");
        if (!mounted) return;
        setSchedule(res.data?.schedule || {});
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [gate]);

  function setDay(day, field, value) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || {}), [field]: value },
    }));
  }

  function toggleDay(day) {
    setSchedule((prev) => {
      const current = prev[day] || {};
      if (current.open || current.close) {
        return { ...prev, [day]: { ...current, open: "", close: "", _closed: true } };
      }
      return { ...prev, [day]: { ...current, open: "08:00", close: "17:00", _closed: false } };
    });
  }

  function isDayActive(day) {
    const d = schedule?.[day];
    if (!d) return false;
    if (d._closed) return false;
    return !!(d.open || d.close);
  }

  async function save() {
    setBusy(true);
    try {
      await api.put("/api/lab/availability", { schedule });
      toast.push("success", "Availability updated ✅");
    } catch (e) {
      toast.push("error", e?.response?.data?.error || e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  /* ── Gates ── */
  if (gate === "checking") return <Loading label="Checking access..." />;

  if (gate !== "active") {
    return (
      <div className="lb-av-locked">
        <CalendarIcon size={32} color="var(--lb-text-muted)" />
        <p>Availability is locked: {message || "Waiting for admin approval."}</p>
      </div>
    );
  }

  const activeDays = DAYS.filter((d) => isDayActive(d.key)).length;

  return (
    <div className="lb-av-page">
      <style>{`
        @keyframes lb-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes lb-slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .lb-anim { animation: lb-slideUp .45s cubic-bezier(.22,1,.36,1) both; }
        .lb-d1 { animation-delay:.08s; }
        .lb-d2 { animation-delay:.16s; }
      `}</style>

      {/* ── Page Header ── */}
      <div className="lb-av-header lb-anim">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
          <div className="lb-av-header-icon">
            <CalendarIcon size={24} color="#fff" />
          </div>
          <div>
            <h1 className="lb-av-header-title">Lab Availability</h1>
            <p className="lb-av-header-sub">
              Configure your weekly operating schedule. Patients and doctors can see when your lab is open.
            </p>
          </div>
        </div>
        <button className="lb-av-save-btn" onClick={save} disabled={busy}>
          {busy ? (
            <><div className="lb-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>
          ) : (
            <><SaveIcon size={16} color="#fff" /> Save Schedule</>
          )}
        </button>
      </div>

      {/* ── Overview strip ── */}
      <div className="lb-av-overview lb-anim lb-d1">
        <div className="lb-av-overview-stat">
          <span className="lb-av-overview-num">{activeDays}</span>
          <span className="lb-av-overview-label">Days Open</span>
        </div>
        <div className="lb-av-overview-stat">
          <span className="lb-av-overview-num">{7 - activeDays}</span>
          <span className="lb-av-overview-label">Days Closed</span>
        </div>
        <div className="lb-av-overview-pills">
          {DAYS.map((d) => (
            <span
              key={d.key}
              className={`lb-av-day-pill ${isDayActive(d.key) ? "active" : ""}`}
            >
              {d.short}
            </span>
          ))}
        </div>
      </div>

      {/* ── Day Cards ── */}
      {loading ? (
        <div className="lb-av-skeleton-grid">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div className="lb-av-day-card" key={i}>
              <Skeleton h={20} w={100} />
              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <Skeleton h={40} w="50%" />
                <Skeleton h={40} w="50%" />
              </div>
              <Skeleton h={60} w="100%" />
            </div>
          ))}
        </div>
      ) : (
        <div className="lb-av-day-grid lb-anim lb-d2">
          {DAYS.map((d) => {
            const active = isDayActive(d.key);
            const day = schedule?.[d.key] || {};
            return (
              <div className={`lb-av-day-card ${active ? "open" : "closed"}`} key={d.key}>
                <div className="lb-av-day-top">
                  <div className="lb-av-day-label">
                    <span className={`lb-av-day-dot ${active ? "active" : ""}`} />
                    <span className="lb-av-day-name">{d.label}</span>
                  </div>
                  <button
                    className={`lb-av-toggle ${active ? "on" : "off"}`}
                    onClick={() => toggleDay(d.key)}
                    title={active ? "Mark as closed" : "Mark as open"}
                  >
                    <span className="lb-av-toggle-thumb" />
                  </button>
                </div>

                {active ? (
                  <div className="lb-av-day-body">
                    <div className="lb-av-time-row">
                      <div className="lb-av-time-field">
                        <label className="lb-av-time-label">
                          <ClockIcon size={13} color="var(--lb-blue)" /> Opens
                        </label>
                        <input
                          type="time"
                          className="lb-av-time-input"
                          value={day.open || ""}
                          onChange={(e) => setDay(d.key, "open", e.target.value)}
                        />
                      </div>
                      <div className="lb-av-time-separator">→</div>
                      <div className="lb-av-time-field">
                        <label className="lb-av-time-label">
                          <ClockIcon size={13} color="var(--lb-blue)" /> Closes
                        </label>
                        <input
                          type="time"
                          className="lb-av-time-input"
                          value={day.close || ""}
                          onChange={(e) => setDay(d.key, "close", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="lb-av-notes-field">
                      <label className="lb-av-time-label">
                        <NoteIcon size={13} color="var(--lb-text-muted)" /> Notes
                      </label>
                      <textarea
                        className="lb-av-notes-input"
                        placeholder="e.g. Lunch break 12:00-13:00"
                        rows={2}
                        value={day.notes || ""}
                        onChange={(e) => setDay(d.key, "notes", e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="lb-av-day-closed-body">
                    <span>Closed</span>
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