import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { apiFetch } from "../api/client";

function calcAge(dob) {
    if (!dob) return "—";
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
}

function Spinner() {
    return (
        <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "var(--p-text-dim)" }}>
            <div style={{ width: 40, height: 40, border: "3px solid var(--p-teal-light)", borderTop: "3px solid var(--p-teal)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span>Loading patient data…</span>
        </div>
    );
}

export default function ConsultationPage() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    // Patient data from API
    const [patient, setPatient] = useState(null);
    const [pastRecords, setPastRecords] = useState([]);
    const [activeAppointment, setActiveAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Form state
    const [symptoms, setSymptoms] = useState("");
    const [notes, setNotes] = useState("");
    const [bloodPressure, setBloodPressure] = useState("");
    const [heartRate, setHeartRate] = useState("");
    const [temperature, setTemperature] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [secondaryDiagnosis, setSecondaryDiagnosis] = useState("");
    const [icdCode, setIcdCode] = useState("");
    const [clinicalSummary, setClinicalSummary] = useState("");
    const [medications, setMedications] = useState([{ name: "", dosage: "", frequency: "", duration: "" }]);
    const [labTests, setLabTests] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [activeSection, setActiveSection] = useState("symptoms");
    const [saving, setSaving] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [successData, setSuccessData] = useState(null);

    // Load patient data + consultation history
    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        async function load() {
            try {
                const data = await apiFetch(`/api/doctor/consultation/${patientId}`);
                if (!cancelled) {
                    setPatient(data.patient);
                    setPastRecords(data.past_records || []);
                    setActiveAppointment(data.active_appointment);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [patientId]);

    function addMedication() {
        setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }]);
    }
    function updateMed(i, field, val) {
        const c = [...medications]; c[i][field] = val; setMedications(c);
    }
    function removeMed(i) {
        setMedications(medications.filter((_, idx) => idx !== i));
    }

    const LAB_OPTIONS = ["Complete Blood Count", "Lipid Panel", "Liver Function", "Thyroid Panel", "Urinalysis", "HbA1c", "Chest X-Ray", "ECG"];
    function toggleLab(t) {
        setLabTests(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    }

    async function handleDocumentUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingDoc(true);
        setSaveError("");
        try {
            const formData = new FormData();
            formData.append("file", file);

            const token = localStorage.getItem("access_token");
            const base = import.meta.env.VITE_API_URL || "";

            const uploadRes = await fetch(`${base}/api/upload`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData,
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

            setDocuments(prev => [...prev, { name: file.name, url: uploadData.url }]);
        } catch (err) {
            setSaveError("Failed to upload document: " + err.message);
        } finally {
            setUploadingDoc(false);
            e.target.value = "";
        }
    }

    // Save consultation to database
    async function handleSave() {
        if (!diagnosis.trim()) {
            setSaveError("Please enter a diagnosis before saving.");
            setActiveSection("diagnosis");
            return;
        }

        setSaving(true);
        setSaveError("");

        try {
            // Filter out empty medication entries
            const validMeds = medications.filter(m => m.name.trim() && m.dosage.trim());

            const payload = {
                patient_id: patientId,
                symptoms: symptoms.trim(),
                diagnosis: diagnosis.trim(),
                secondary_diagnosis: secondaryDiagnosis.trim(),
                icd_code: icdCode.trim(),
                clinical_summary: clinicalSummary.trim(),
                notes: notes.trim(),
                blood_pressure: bloodPressure.trim(),
                heart_rate: heartRate.trim(),
                temperature: temperature.trim(),
                medications: validMeds,
                lab_tests: labTests,
                documents: documents,
            };

            const result = await apiFetch("/api/doctor/consultation", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            setSuccessData({
                record_id: result.record_id,
                meds_count: result.prescription_ids?.length || 0
            });
        } catch (err) {
            setSaveError(err.message || "Failed to save consultation");
        } finally {
            setSaving(false);
        }
    }

    // Save as draft (just alert, same as save for now)
    function handleSaveDraft() {
        // In a full implementation, you'd save with a "draft" status
        alert("💾 Draft functionality coming soon. Use 'Complete & Save' to save the consultation.");
    }

    const sections = [
        { key: "symptoms", label: "Symptoms & Notes", icon: "📝" },
        { key: "diagnosis", label: "Diagnosis", icon: "🩺" },
        { key: "prescription", label: "Prescription", icon: "💊" },
        { key: "lab", label: "Lab Requests", icon: "🧪" },
        { key: "documents", label: "Documents", icon: "📎" },
        { key: "history", label: "Past Records", icon: "📋" },
    ];

    if (!patientId) {
        return (
            <PortalLayout title="Consultation Workspace" subtitle="No Patient Selected">
                <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
                    <div className="p-card animate-in zoom-in" style={{ textAlign: "center", padding: "48px 32px", maxWidth: 440, width: "100%", border: "1px solid var(--p-card-border)" }}>
                        <div style={{ width: 80, height: 80, background: "var(--p-teal-light)", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--p-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                <path d="M11 8v6" /><path d="M8 11h6" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "var(--p-text)" }}>Start a Consultation</h2>
                        <p style={{ color: "var(--p-text-dim)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
                            Please select a patient from the lookup tool to begin a new consultation session.
                        </p>
                        <button className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15, fontWeight: 600 }} onClick={() => navigate("/doctor/patients")}>
                            Go to Patient Lookup
                        </button>
                    </div>
                </div>
            </PortalLayout>
        );
    }

    if (loading) {
        return (
            <PortalLayout title="Consultation Workspace" subtitle="Loading…">
                <Spinner />
            </PortalLayout>
        );
    }

    if (error) {
        return (
            <PortalLayout title="Consultation Workspace" subtitle="Error">
                <div className="p-card" style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h3 style={{ color: "var(--p-red)", marginBottom: 8 }}>Failed to load patient</h3>
                    <p style={{ color: "var(--p-text-dim)", marginBottom: 24 }}>{error}</p>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Go Back</button>
                </div>
            </PortalLayout>
        );
    }

    const p = patient || {};
    const allergies = p.allergies ? p.allergies.split(",").map(a => a.trim()).filter(Boolean) : [];
    const initials = (p.name || "").split(" ").map(n => n[0]).join("").slice(0, 2);

    return (
        <PortalLayout title="Consultation Workspace" subtitle="Active Session"
            actions={
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={saving}>Save Draft</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving…" : "Complete & Save"}
                    </button>
                </div>
            }
        >
            {/* Save Error Banner */}
            {saveError && (
                <div className="animate-in" style={{ marginBottom: 16, padding: "12px 20px", background: "var(--p-red-light)", borderRadius: 10, color: "var(--p-red)", fontWeight: 600, fontSize: 14, border: "1px solid rgba(239,68,68,.2)" }}>
                    ⚠️ {saveError}
                </div>
            )}

            {/* Patient Bar — now with real data */}
            <div className="p-card animate-in" style={{ marginBottom: 24, padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div className="avatar">{initials}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name || "Unknown Patient"}</div>
                        <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>
                            {p.patient_id} · {calcAge(p.dob)}y · {p.gender || "—"} · {p.blood_group || "Unknown blood group"}
                        </div>
                    </div>
                    {allergies.length > 0 && (
                        <span className="badge badge-red" style={{ fontSize: 12, padding: "5px 12px" }}>
                            ⚠️ Allergic: {allergies.join(", ")}
                        </span>
                    )}
                    {activeAppointment && (
                        <>
                            <span className="badge badge-amber">{activeAppointment.status}</span>
                            <span className="badge badge-blue">{activeAppointment.time}</span>
                        </>
                    )}
                    {!activeAppointment && (
                        <span className="badge badge-teal">Walk-in Visit</span>
                    )}
                </div>
            </div>

            <div className="grid-sidebar animate-in delay-1" style={{ gridTemplateColumns: "220px 1fr" }}>
                {/* Section Nav */}
                <div>
                    <div className="p-card" style={{ padding: 12, position: "sticky", top: 80 }}>
                        {sections.map(s => (
                            <button key={s.key}
                                className={`sidebar-link ${activeSection === s.key ? "active" : ""}`}
                                onClick={() => setActiveSection(s.key)}
                                style={{
                                    color: activeSection === s.key ? "var(--p-teal)" : "var(--p-text-dim)",
                                    background: activeSection === s.key ? "var(--p-teal-light)" : "transparent",
                                    borderRadius: 8, padding: "10px 14px", width: "100%",
                                    border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                                    gap: 10, fontWeight: activeSection === s.key ? 700 : 500, fontSize: 14,
                                    fontFamily: "inherit", marginBottom: 4, transition: "all .2s",
                                }}>
                                <span>{s.icon}</span> {s.label}
                                {s.key === "history" && pastRecords.length > 0 && (
                                    <span className="badge badge-teal" style={{ marginLeft: "auto", fontSize: 11 }}>{pastRecords.length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div>
                    {/* Symptoms */}
                    {activeSection === "symptoms" && (
                        <div className="p-card">
                            <h3 className="p-card-title" style={{ marginBottom: 20 }}>📝 Symptoms & Clinical Notes</h3>
                            <div className="p-field">
                                <label className="p-label">Presenting Symptoms</label>
                                <textarea className="p-textarea p-input" value={symptoms} onChange={e => setSymptoms(e.target.value)}
                                    placeholder="Describe patient's symptoms, complaints, and observations..." rows={5} />
                            </div>
                            <div className="p-field">
                                <label className="p-label">Clinical Notes</label>
                                <textarea className="p-textarea p-input" value={notes} onChange={e => setNotes(e.target.value)}
                                    placeholder="Additional notes, examination findings, vitals..." rows={4} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                <div className="p-field">
                                    <label className="p-label">Blood Pressure</label>
                                    <input className="p-input" placeholder="120/80 mmHg" value={bloodPressure} onChange={e => setBloodPressure(e.target.value)} />
                                </div>
                                <div className="p-field">
                                    <label className="p-label">Heart Rate</label>
                                    <input className="p-input" placeholder="72 bpm" value={heartRate} onChange={e => setHeartRate(e.target.value)} />
                                </div>
                                <div className="p-field">
                                    <label className="p-label">Temperature</label>
                                    <input className="p-input" placeholder="98.6°F" value={temperature} onChange={e => setTemperature(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Diagnosis */}
                    {activeSection === "diagnosis" && (
                        <div className="p-card">
                            <h3 className="p-card-title" style={{ marginBottom: 20 }}>🩺 Diagnosis</h3>
                            <div className="p-field">
                                <label className="p-label">Primary Diagnosis <span style={{ color: "var(--p-red)" }}>*</span></label>
                                <input className="p-input" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Enter primary diagnosis (e.g., Hypertension Stage 1)..." />
                            </div>
                            <div className="p-field">
                                <label className="p-label">Secondary Diagnosis (optional)</label>
                                <input className="p-input" value={secondaryDiagnosis} onChange={e => setSecondaryDiagnosis(e.target.value)} placeholder="Enter secondary diagnosis if applicable..." />
                            </div>
                            <div className="p-field">
                                <label className="p-label">ICD-10 Code (optional)</label>
                                <input className="p-input" value={icdCode} onChange={e => setIcdCode(e.target.value)} placeholder="e.g., I10" />
                            </div>
                            <div className="p-field">
                                <label className="p-label">Clinical Summary</label>
                                <textarea className="p-textarea p-input" value={clinicalSummary} onChange={e => setClinicalSummary(e.target.value)} placeholder="Summarize findings & diagnosis rationale..." rows={4} />
                            </div>
                        </div>
                    )}

                    {/* Prescription */}
                    {activeSection === "prescription" && (
                        <div className="p-card">
                            <div className="p-card-header">
                                <h3 className="p-card-title">💊 Prescription</h3>
                                <button className="btn btn-sm btn-primary" onClick={addMedication}>+ Add Medication</button>
                            </div>
                            {medications.map((med, i) => (
                                <div key={i} style={{ padding: 16, background: "#f8fafc", borderRadius: 10, border: "1px solid var(--p-card-border)", marginBottom: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--p-text-dim)" }}>Medication #{i + 1}</span>
                                        {medications.length > 1 && <button className="btn btn-sm btn-danger" onClick={() => removeMed(i)}>Remove</button>}
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div className="p-field"><label className="p-label">Medication Name</label><input className="p-input" value={med.name} onChange={e => updateMed(i, "name", e.target.value)} placeholder="e.g., Amlodipine" /></div>
                                        <div className="p-field"><label className="p-label">Dosage</label><input className="p-input" value={med.dosage} onChange={e => updateMed(i, "dosage", e.target.value)} placeholder="e.g., 5mg" /></div>
                                        <div className="p-field"><label className="p-label">Frequency</label><input className="p-input" value={med.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} placeholder="e.g., Once daily" /></div>
                                        <div className="p-field"><label className="p-label">Duration</label><input className="p-input" value={med.duration} onChange={e => updateMed(i, "duration", e.target.value)} placeholder="e.g., 30 days" /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Lab Requests */}
                    {activeSection === "lab" && (
                        <div className="p-card">
                            <h3 className="p-card-title" style={{ marginBottom: 20 }}>🧪 Lab Test Requests</h3>
                            <p style={{ fontSize: 14, color: "var(--p-text-dim)", marginBottom: 16 }}>Select tests to request for this patient:</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {LAB_OPTIONS.map(t => (
                                    <button key={t} onClick={() => toggleLab(t)} style={{
                                        display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
                                        background: labTests.includes(t) ? "var(--p-teal-light)" : "#f8fafc",
                                        border: `2px solid ${labTests.includes(t) ? "var(--p-teal)" : "var(--p-card-border)"}`,
                                        borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 14,
                                        fontWeight: labTests.includes(t) ? 700 : 500, color: labTests.includes(t) ? "var(--p-teal)" : "var(--p-text)",
                                        transition: "all .2s",
                                    }}>
                                        <span style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${labTests.includes(t) ? "var(--p-teal)" : "#cbd5e1"}`, display: "grid", placeItems: "center", fontSize: 12, background: labTests.includes(t) ? "var(--p-teal)" : "transparent", color: "#fff" }}>
                                            {labTests.includes(t) && "✓"}
                                        </span>
                                        {t}
                                    </button>
                                ))}
                            </div>
                            {labTests.length > 0 && (
                                <div style={{ marginTop: 20, padding: 16, background: "var(--p-teal-light)", borderRadius: 10 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Selected Tests ({labTests.length}):</div>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        {labTests.map(t => <span key={t} className="badge badge-teal">{t}</span>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Documents */}
                    {activeSection === "documents" && (
                        <div className="p-card">
                            <h3 className="p-card-title" style={{ marginBottom: 20 }}>📎 Attach Documents</h3>

                            <input type="file" id="consultation-doc-upload" accept="image/*,.pdf,.doc,.docx" style={{ display: "none" }} onChange={handleDocumentUpload} />

                            <div style={{ border: "2px dashed var(--p-input-border)", borderRadius: 12, padding: "48px 24px", textAlign: "center", cursor: "pointer", transition: "border-color .2s", opacity: uploadingDoc ? 0.6 : 1 }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--p-teal)"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--p-input-border)"}
                                onClick={() => !uploadingDoc && document.getElementById("consultation-doc-upload").click()}
                            >
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                                    {uploadingDoc ? "⏳ Uploading..." : "Drop files here or click to upload"}
                                </div>
                                <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>Supports PDF, images, and documents up to 10MB</div>
                            </div>

                            {documents.length > 0 && (
                                <div style={{ marginTop: 24 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "var(--p-text-dim)" }}>Attached Files ({documents.length})</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {documents.map((doc, idx) => (
                                            <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", border: "1px solid var(--p-card-border)", borderRadius: 8 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <span style={{ fontSize: 20 }}>📑</span>
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "var(--p-teal)", textDecoration: "none" }}>{doc.name}</a>
                                                </div>
                                                <button className="btn btn-sm btn-danger" onClick={() => setDocuments(docs => docs.filter((_, i) => i !== idx))}>Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Past Records / History */}
                    {activeSection === "history" && (
                        <div className="p-card">
                            <h3 className="p-card-title" style={{ marginBottom: 20 }}>📋 Past Medical Records</h3>
                            {pastRecords.length === 0 ? (
                                <div className="empty-state">
                                    <h3>No past records</h3>
                                    <p>This patient has no previous consultation records.</p>
                                </div>
                            ) : (
                                pastRecords.map((rec, i) => (
                                    <div key={rec.record_id} style={{
                                        padding: 20, background: "#f8fafc", borderRadius: 12,
                                        border: "1px solid var(--p-card-border)", marginBottom: 16,
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                            <div>
                                                <span className="badge badge-purple" style={{ marginRight: 8 }}>{rec.record_id}</span>
                                                <span style={{ fontSize: 13, color: "var(--p-text-dim)" }}>{rec.date}</span>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "var(--p-text)" }}>Diagnosis</div>
                                            <div style={{ fontSize: 14, color: "var(--p-text-dim)" }}>{rec.diagnosis}</div>
                                        </div>
                                        {rec.notes && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: "var(--p-text-dim)" }}>Notes</div>
                                                <div style={{ fontSize: 13, color: "var(--p-text-dim)", whiteSpace: "pre-line" }}>{rec.notes}</div>
                                            </div>
                                        )}
                                        {rec.medications && rec.medications.length > 0 && (
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--p-text-dim)" }}>Medications</div>
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                    {rec.medications.map((m, j) => (
                                                        <span key={j} className="badge badge-blue" title={`${m.dosage}${m.frequency ? ` · ${m.frequency}` : ""}${m.duration_days ? ` · ${m.duration_days} days` : ""}`}>
                                                            {m.medicine_name} — {m.dosage}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Success Modal */}
            {successData && (
                <div className="modal-overlay" style={{ zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="modal-content animate-in zoom-in" style={{ maxWidth: 400, width: "100%", textAlign: "center", padding: "40px 28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                        <div style={{ width: 72, height: 72, background: "var(--p-teal-light)", color: "var(--p-teal)", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "var(--p-text)" }}>Consultation Saved</h2>
                        <p style={{ color: "var(--p-text-dim)", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
                            The medical record and prescriptions have been successfully recorded.
                        </p>
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: 12, marginBottom: 28, textAlign: "left", display: "flex", flexDirection: "column", gap: 10, border: "1px solid var(--p-card-border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ color: "var(--p-text-dim)", fontSize: 13, fontWeight: 600 }}>Record ID</span>
                                <span style={{ fontWeight: 700, fontSize: 13 }} className="badge badge-purple">{successData.record_id}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ color: "var(--p-text-dim)", fontSize: 13, fontWeight: 600 }}>Prescriptions Issued</span>
                                <span style={{ fontWeight: 700, fontSize: 13 }} className="badge badge-blue">{successData.meds_count} items</span>
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15, fontWeight: 600 }} onClick={() => navigate(`/doctor/patient/${patientId}`)}>
                            Continue to Patient Profile
                        </button>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
