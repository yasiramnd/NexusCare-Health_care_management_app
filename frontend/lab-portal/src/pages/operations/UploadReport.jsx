import { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import Loading from "../../components/Loading.jsx";
import Badge from "../../components/Badge.jsx";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";
import { useOutletContext } from "react-router-dom";

export default function UploadReport() {
  const { gate, message } = useLabGate();
  const { toast } = useOutletContext();

  const maxMb = Number(import.meta.env.VITE_MAX_UPLOAD_MB || 20);

  const [reqs, setReqs] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingReqs, setLoadingReqs] = useState(false);

  useEffect(() => {
    if (gate !== "active") return;
    let mounted = true;

    async function loadReqs() {
      setLoadingReqs(true);
      try {
        const res = await api.get("/api/lab/requests?status=all");
        if (!mounted) return;
        // Upload is meaningful for accepted/in_progress/pending too
        setReqs(res.data || []);
      } finally {
        if (mounted) setLoadingReqs(false);
      }
    }

    loadReqs();
    return () => (mounted = false);
  }, [gate]);

  function pickFile(f) {
    if (!f) return;

    const name = (f.name || "").toLowerCase();
    if (!name.endsWith(".pdf")) {
      toast.push("error", "Only PDF files are allowed.");
      return;
    }
    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > maxMb) {
      toast.push("error", `Max file size is ${maxMb}MB.`);
      return;
    }
    setFile(f);
  }

  async function upload() {
    if (!selectedId) return toast.push("error", "Select a request first.");
    if (!file) return toast.push("error", "Select a PDF file.");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      await api.post(`/api/lab/requests/${selectedId}/upload-report`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.push("success", "Report uploaded ✅ Request marked completed.");
      setFile(null);
    } catch (e) {
      toast.push("error", e?.response?.data?.error || e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  if (gate === "checking") return <Loading label="Checking access..." />;

  if (gate !== "active") {
    return (
      <Card className="p-6">
        <div className="font-semibold">Upload Reports</div>
        <div className="mt-2 text-sm text-gray-600">
          Locked: {message || "Waiting for admin approval."}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="p-6 lg:col-span-2">
        <div className="font-semibold text-gray-900">Select Request</div>
        <div className="text-sm text-gray-500 mt-1">Choose a request and upload PDF report (max {maxMb}MB)</div>

        {loadingReqs ? (
          <Loading />
        ) : (
          <div className="mt-4 space-y-2 max-h-[420px] overflow-auto pr-1">
            {reqs.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(String(r.id))}
                className={`w-full text-left p-4 rounded-2xl border transition ${
                  String(r.id) === selectedId ? "border-teal-600 bg-teal-50" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">
                    #{r.id} • {r.patient_name}
                  </div>
                  <Badge text={r.status} />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {r.test_name} • {r.patient_email}
                </div>
                <div className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()}</div>
              </button>
            ))}
            {reqs.length === 0 && <div className="text-sm text-gray-500">No requests available</div>}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="font-semibold text-gray-900">Upload PDF</div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-600">REQUEST ID</div>
          <div className="mt-1 p-3 rounded-xl border bg-gray-50 text-gray-800">
            {selectedId ? `#${selectedId}` : "Not selected"}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-600">PDF FILE</div>
          <input
            type="file"
            accept="application/pdf"
            className="mt-2 w-full text-sm"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          {file && (
            <div className="mt-2 text-xs text-gray-600">
              Selected: <span className="font-semibold">{file.name}</span>
            </div>
          )}
        </div>

        <button
          onClick={upload}
          disabled={busy}
          className="mt-6 w-full py-3 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800 disabled:opacity-60"
        >
          {busy ? "Uploading..." : "Upload Report"}
        </button>

        <div className="mt-3 text-xs text-gray-500">
          Backend enforces PDF-only + max upload size too.
        </div>
      </Card>
    </div>
  );
}