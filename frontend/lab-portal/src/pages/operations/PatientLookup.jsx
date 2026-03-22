import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../../components/Card.jsx";
import Table from "../../components/Table.jsx";
import Loading from "../../components/Loading.jsx";
import Badge from "../../components/Badge.jsx";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";
import { useOutletContext } from "react-router-dom";

export default function PatientLookup() {
  const { gate, message } = useLabGate();
  const { toast } = useOutletContext();

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [patient, setPatient] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [uploadingRequestId, setUploadingRequestId] = useState("");
  const [uploadTargetId, setUploadTargetId] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const detectorRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  function stopScanner() {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }

  async function runLookup(rawQuery) {
    const q = (rawQuery || "").trim();
    if (!q) {
      toast.push("error", "Enter patient QR, patient ID, or patient email.");
      return;
    }

    setBusy(true);
    setHistoryRows([]);
    try {
      const res = await api.get(`/api/lab/patient/lookup?qr=${encodeURIComponent(q)}`);
      setPatient(res.data || null);
      toast.push("success", "Patient found.");

      if (res.data?.patient_id) {
        await loadHistory(res.data.patient_id);
      }
    } catch (e1) {
      setPatient(null);
      setHistoryRows([]);
      toast.push("error", e1?.response?.data?.error || e1?.message || "Patient lookup failed");
    } finally {
      setBusy(false);
      setHistoryBusy(false);
    }
  }

  async function loadHistory(patientId) {
    if (!patientId) {
      setHistoryRows([]);
      return;
    }

    setHistoryBusy(true);
    try {
      const hist = await api.get(`/api/lab/patient/${patientId}/history`);
      setHistoryRows(hist.data?.history || []);
    } finally {
      setHistoryBusy(false);
    }
  }

  function pickReportFile(requestId) {
    setUploadTargetId(String(requestId || ""));
    fileInputRef.current?.click();
  }

  async function onReportFileChange(e) {
    const file = e.target.files?.[0];
    const requestId = uploadTargetId;
    e.target.value = "";

    if (!file || !requestId) return;

    const name = (file.name || "").toLowerCase();
    if (!name.endsWith(".pdf")) {
      toast.push("error", "Only PDF reports are allowed.");
      return;
    }

    try {
      setUploadingRequestId(requestId);
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/api/lab/requests/${requestId}/upload-report`, fd);
      toast.push("success", "Report uploaded successfully.");
      await loadHistory(patient?.patient_id);
    } catch (err) {
      toast.push("error", err?.response?.data?.error || err?.message || "Upload failed");
    } finally {
      setUploadingRequestId("");
      setUploadTargetId("");
    }
  }

  const historyColumns = useMemo(
    () => [
      { key: "id", label: "REQUEST ID" },
      { key: "test_name", label: "TEST" },
      { key: "priority", label: "PRIORITY" },
      { key: "status", label: "STATUS", render: (r) => <Badge text={r.status} /> },
      {
        key: "created_at",
        label: "REQUESTED",
        render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : "-")
      },
      {
        key: "report_uploaded_at",
        label: "REPORT UPLOADED",
        render: (r) => (r.report_uploaded_at ? new Date(r.report_uploaded_at).toLocaleString() : "-")
      },
      {
        key: "actions",
        label: "ACTIONS",
        render: (r) => {
          const isUploading = uploadingRequestId === String(r.id);
          return (
            <button
              type="button"
              onClick={() => pickReportFile(r.id)}
              disabled={isUploading}
              className="px-3 py-1 rounded-lg text-xs bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {isUploading ? "Uploading..." : "Upload Report"}
            </button>
          );
        }
      }
    ],
    [uploadingRequestId]
  );

  async function searchPatient(e) {
    e?.preventDefault?.();
    await runLookup(query);
  }

  async function openScanner() {
    if (!window.BarcodeDetector) {
      toast.push("error", "QR scanning is not supported in this browser. Use manual search.");
      return;
    }

    try {
      setScannerBusy(true);
      setScannerOpen(true);

      const formats = await window.BarcodeDetector.getSupportedFormats();
      const qrFormats = formats.includes("qr_code") ? ["qr_code"] : formats;
      detectorRef.current = new window.BarcodeDetector({ formats: qrFormats });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      scanTimerRef.current = setInterval(async () => {
        const video = videoRef.current;
        const detector = detectorRef.current;
        if (!video || !detector || video.readyState < 2) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const detected = await detector.detect(canvas);
          const firstCode = detected?.[0]?.rawValue?.trim();
          if (!firstCode) return;

          setQuery(firstCode);
          stopScanner();
          setScannerOpen(false);
          toast.push("success", "QR scanned successfully.");
          await runLookup(firstCode);
        } catch {
          // Ignore decode failures and keep scanning.
        }
      }, 700);
    } catch (err) {
      toast.push("error", err?.message || "Unable to start camera scanner.");
      stopScanner();
      setScannerOpen(false);
    } finally {
      setScannerBusy(false);
    }
  }

  function closeScanner() {
    stopScanner();
    setScannerOpen(false);
  }

  if (gate === "checking") return <Loading label="Checking access..." />;

  if (gate !== "active") {
    return (
      <Card className="p-6">
        <div className="font-semibold">Scan QR / Patient Lookup</div>
        <div className="mt-2 text-sm text-gray-600">
          Locked: {message || "Waiting for admin approval."}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="p-6 lg:col-span-1">
        <div className="font-semibold text-gray-900">Find Patient</div>
        <div className="text-sm text-gray-500 mt-1">Use QR value, patient ID, or email</div>

        <form onSubmit={searchPatient} className="mt-4 space-y-3">
          <input
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="PT0001, QR value, or patient@email.com"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800 disabled:opacity-60"
          >
            {busy ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={openScanner}
            disabled={scannerBusy}
            className="w-full py-3 rounded-xl border border-teal-700 text-teal-700 font-semibold hover:bg-teal-50 disabled:opacity-60"
          >
            {scannerBusy ? "Opening Camera..." : "Scan Patient QR"}
          </button>
        </form>

        {scannerOpen && (
          <div className="mt-4 rounded-xl border border-gray-200 p-3 bg-gray-50">
            <div className="text-xs font-semibold text-gray-600 mb-2">QR SCANNER</div>
            <video
              ref={videoRef}
              className="w-full rounded-lg border border-gray-200 bg-black"
              playsInline
              muted
            />
            <div className="mt-2 text-xs text-gray-500">
              Point camera to patient QR code. Scanning runs automatically.
            </div>
            <button
              type="button"
              onClick={closeScanner}
              className="mt-3 w-full py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white"
            >
              Close Scanner
            </button>
          </div>
        )}
      </Card>

      <Card className="p-6 lg:col-span-2">
        <div className="font-semibold text-gray-900">Patient Snapshot</div>

        {!patient ? (
          <div className="mt-4 text-sm text-gray-500">Search a patient to view details and lab history.</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Info label="Patient ID" value={patient.patient_id} />
            <Info label="Name" value={patient.name} />
            <Info label="Email" value={patient.email} />
            <Info label="Contact" value={patient.contact_no} />
            <Info label="Gender" value={patient.gender} />
            <Info label="DOB" value={patient.date_of_birth} />
            <Info label="Blood Group" value={patient.blood_group} />
            <Info label="Last Visit" value={patient.last_visit} />
            <Info label="Allergies" value={patient.allergies} />
            <Info label="Chronic Conditions" value={patient.chronic_conditions} />
            <Info label="Address" value={patient.address} />
            <Info label="Lab Requests" value={String(patient.lab_requests ?? 0)} />
          </div>
        )}
      </Card>

      <Card className="p-6 lg:col-span-3">
        <div className="font-semibold text-gray-900 mb-4">Patient Lab History</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onReportFileChange}
        />
        {historyBusy ? (
          <Loading />
        ) : (
          <Table
            columns={historyColumns}
            rows={historyRows}
            emptyText={patient ? "No lab history for this patient" : "Search a patient to view history"}
          />
        )}
      </Card>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <div className="text-sm text-gray-900 mt-1">{value || "-"}</div>
    </div>
  );
}
