import { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import Loading from "../../components/Loading.jsx";
import Table from "../../components/Table.jsx";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";
import { useOutletContext } from "react-router-dom";

export default function OfferedTests() {
  const { gate, message } = useLabGate();
  const { toast } = useOutletContext();

  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    test_name: "",
    duration: "",
    sample_type: "",
    category: ""
  });

  async function load() {
    setBusy(true);
    try {
      const res = await api.get("/api/lab/tests");
      setRows(res.data || []);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (gate !== "active") return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate]);

  async function add() {
    if (!form.test_name.trim()) return toast.push("error", "test_name required");
    try {
      await api.post("/api/lab/tests", form);
      toast.push("success", "Test added ✅");
      setForm({ test_name: "", duration: "", sample_type: "", category: "" });
      load();
    } catch (e) {
      toast.push("error", e?.response?.data?.error || e?.message || "Add failed");
    }
  }

  async function del(id) {
    if (!confirm(`Delete test #${id}?`)) return;
    try {
      await api.delete(`/api/lab/tests/${id}`);
      toast.push("success", "Deleted ✅");
      load();
    } catch (e) {
      toast.push("error", e?.response?.data?.error || e?.message || "Delete failed");
    }
  }

  if (gate === "checking") return <Loading label="Checking access..." />;

  if (gate !== "active") {
    return (
      <Card className="p-6">
        <div className="font-semibold">Offered Tests</div>
        <div className="mt-2 text-sm text-gray-600">
          Locked: {message || "Waiting for admin approval."}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="p-6">
        <div className="font-semibold text-gray-900">Add Offered Test</div>

        <div className="mt-4 space-y-3">
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Test name"
            value={form.test_name}
            onChange={(e) => setForm((p) => ({ ...p, test_name: e.target.value }))}
          />
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Duration (e.g., 2 days)"
            value={form.duration}
            onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
          />
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Sample type (e.g., Blood)"
            value={form.sample_type}
            onChange={(e) => setForm((p) => ({ ...p, sample_type: e.target.value }))}
          />
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Category (e.g., Hematology)"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          />

          <button
            onClick={add}
            className="w-full py-3 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800"
          >
            Add Test
          </button>
        </div>
      </Card>

      <Card className="p-6 lg:col-span-2">
        <div className="font-semibold text-gray-900 mb-4">My Offered Tests</div>

        {busy ? (
          <Loading />
        ) : (
          <Table
            columns={[
              { key: "id", label: "ID" },
              { key: "test_name", label: "TEST NAME" },
              { key: "duration", label: "DURATION" },
              { key: "sample_type", label: "SAMPLE" },
              { key: "category", label: "CATEGORY" },
              {
                key: "actions",
                label: "ACTIONS",
                render: (r) => (
                  <button
                    onClick={() => del(r.id)}
                    className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>
                )
              }
            ]}
            rows={rows}
            emptyText="No tests added yet"
          />
        )}
      </Card>
    </div>
  );
}