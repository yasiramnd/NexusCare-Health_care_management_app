import { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import Loading from "../../components/Loading.jsx";
import Table from "../../components/Table.jsx";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";
import { useOutletContext } from "react-router-dom";

export default function ReportsHistory() {
  const { gate, message } = useLabGate();
  const { toast } = useOutletContext();

  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (gate !== "active") return;
    let mounted = true;

    async function load() {
      setBusy(true);
      try {
        const res = await api.get("/api/lab/reports");
        if (!mounted) return;
        setRows(res.data || []);
      } finally {
        if (mounted) setBusy(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [gate]);

  async function downloadReport(id, fileName) {
    try {
      const res = await api.get(`/api/lab/reports/${id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.push("error", e?.response?.data?.error || e?.message || "Download failed");
    }
  }

  if (gate === "checking") return <Loading label="Checking access..." />;

  if (gate !== "active") {
    return (
      <Card className="p-6">
        <div className="font-semibold">Reports History</div>
        <div className="mt-2 text-sm text-gray-600">
          Locked: {message || "Waiting for admin approval."}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="font-semibold text-gray-900 mb-4">Reports History</div>

      {busy ? (
        <Loading />
      ) : (
        <Table
          columns={[
            { key: "id", label: "REPORT ID" },
            { key: "request_id", label: "REQUEST ID" },
            { key: "file_name", label: "FILE" },
            { key: "uploaded_at", label: "UPLOADED", render: (r) => new Date(r.uploaded_at).toLocaleString() },
            {
              key: "download",
              label: "ACTIONS",
              render: (r) => (
                <button
                  onClick={() => downloadReport(r.id, r.file_name)}
                  className="px-3 py-2 rounded-xl bg-gray-900 text-white text-xs hover:bg-black"
                >
                  Download
                </button>
              )
            }
          ]}
          rows={rows}
          emptyText="No reports uploaded yet"
        />
      )}
    </Card>
  );
}