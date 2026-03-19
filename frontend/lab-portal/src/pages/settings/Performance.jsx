import { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import Loading from "../../components/Loading.jsx";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";

export default function Performance() {
  const { gate, message } = useLabGate();
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (gate !== "active") return;
    let mounted = true;

    async function load() {
      setBusy(true);
      try {
        const res = await api.get("/api/lab/stats");
        if (!mounted) return;
        setStats(res.data);
      } finally {
        if (mounted) setBusy(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [gate]);

  if (gate === "checking") return <Loading label="Checking access..." />;

  if (gate !== "active") {
    return (
      <Card className="p-6">
        <div className="font-semibold">Performance Stats</div>
        <div className="mt-2 text-sm text-gray-600">
          Locked: {message || "Waiting for admin approval."}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="font-semibold text-gray-900">Lab Performance Statistics</div>
      <div className="text-sm text-gray-500 mt-1">Summary by request status</div>

      {busy ? (
        <Loading />
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <Stat label="Total" value={stats?.total} />
          <Stat label="Pending" value={stats?.pending} />
          <Stat label="In Progress" value={stats?.in_progress} />
          <Stat label="Completed" value={stats?.completed} />
          <Stat label="Sent" value={stats?.sent} />
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{value ?? "—"}</div>
    </div>
  );
}