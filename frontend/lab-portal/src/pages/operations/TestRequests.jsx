import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card.jsx";
import Loading from "../../components/Loading.jsx";
import Table from "../../components/Table.jsx";
import Badge from "../../components/Badge.jsx";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";
import { useOutletContext } from "react-router-dom";

const STATUSES = ["all", "pending", "accepted", "rejected", "in_progress", "completed", "sent"];

export default function TestRequests() {
  const { gate, message } = useLabGate();
  const { toast } = useOutletContext();
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const res = await api.get(`/api/lab/requests?status=${encodeURIComponent(status)}`);
      setRows(res.data || []);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (gate !== "active") return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate, status]);

  async function setReqStatus(id, next) {
    try {
      await api.put(`/api/lab/requests/${id}/status`, { status: next });
      toast.push("success", `Request #${id} updated to ${next}`);
      load();
    } catch (e) {
      toast.push("error", e?.response?.data?.error || e?.message || "Update failed");
    }
  }

  const columns = useMemo(
    () => [
      { key: "id", label: "REQ ID" },
      { key: "patient_name", label: "PATIENT" },
      { key: "patient_email", label: "EMAIL" },
      { key: "test_name", label: "TEST" },
      { key: "priority", label: "PRIORITY" },
      { key: "status", label: "STATUS", render: (r) => <Badge text={r.status} /> },
      { key: "created_at", label: "DATE", render: (r) => new Date(r.created_at).toLocaleString() },
      {
        key: "actions",
        label: "ACTIONS",
        render: (r) => (
          <div className="flex gap-2 flex-wrap">
            <button
              className="px-3 py-1 rounded-lg text-xs bg-gray-900 text-white hover:bg-black disabled:opacity-50"
              disabled={r.status === "accepted"}
              onClick={() => setReqStatus(r.id, "accepted")}
            >
              Accept
            </button>
            <button
              className="px-3 py-1 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={r.status === "rejected"}
              onClick={() => setReqStatus(r.id, "rejected")}
            >
              Reject
            </button>
            <button
              className="px-3 py-1 rounded-lg text-xs bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              disabled={r.status === "in_progress"}
              onClick={() => setReqStatus(r.id, "in_progress")}
            >
              In Progress
            </button>
            <button
              className="px-3 py-1 rounded-lg text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              disabled={r.status === "completed"}
              onClick={() => setReqStatus(r.id, "completed")}
            >
              Completed
            </button>
            <button
              className="px-3 py-1 rounded-lg text-xs bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
              disabled={r.status === "sent"}
              onClick={() => setReqStatus(r.id, "sent")}
            >
              Sent
            </button>
          </div>
        )
      }
    ],
    [toast]
  );

  if (gate === "checking") return <Loading label="Checking access..." />;

  if (gate !== "active") {
    return (
      <Card className="p-6">
        <div className="font-semibold">Test Requests</div>
        <div className="mt-2 text-sm text-gray-600">
          Locked: {message || "Waiting for admin approval."}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="font-semibold text-gray-900">Test Requests</div>

          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                  status === s ? "bg-teal-700 text-white border-teal-700" : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {busy ? <Loading /> : <Table columns={columns} rows={rows} emptyText="No requests found" />}
        </div>
      </Card>
    </div>
  );
}