import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card.jsx";
import Loading from "../../components/Loading.jsx";
import Table from "../../components/Table.jsx";
import Badge from "../../components/Badge.jsx";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";

export default function PatientLabHistory() {
  const { gate, message } = useLabGate();
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (gate !== "active") return;
    let mounted = true;

    async function load() {
      setBusy(true);
      try {
        const res = await api.get("/api/lab/requests?status=all");
        if (!mounted) return;
        setAll(res.data || []);
      } finally {
        if (mounted) setBusy(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [gate]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter(
      (r) =>
        (r.patient_name || "").toLowerCase().includes(s) ||
        (r.patient_email || "").toLowerCase().includes(s) ||
        (r.test_name || "").toLowerCase().includes(s)
    );
  }, [all, q]);

  if (gate === "checking") return <Loading label="Checking access..." />;

  if (gate !== "active") {
    return (
      <Card className="p-6">
        <div className="font-semibold">Patient Lab History</div>
        <div className="mt-2 text-sm text-gray-600">
          Locked: {message || "Waiting for admin approval."}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="font-semibold text-gray-900">Patient Lab History</div>
          <div className="text-sm text-gray-500">Search by patient name/email/test</div>
        </div>

        <input
          className="w-full md:w-80 px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-200"
          placeholder="Search..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-4">
        {busy ? (
          <Loading />
        ) : (
          <Table
            columns={[
              { key: "patient_name", label: "PATIENT" },
              { key: "patient_email", label: "EMAIL" },
              { key: "test_name", label: "TEST" },
              { key: "priority", label: "PRIORITY" },
              { key: "status", label: "STATUS", render: (r) => <Badge text={r.status} /> },
              { key: "created_at", label: "DATE", render: (r) => new Date(r.created_at).toLocaleString() }
            ]}
            rows={filtered}
            emptyText="No records found"
          />
        )}
      </div>
    </Card>
  );
}