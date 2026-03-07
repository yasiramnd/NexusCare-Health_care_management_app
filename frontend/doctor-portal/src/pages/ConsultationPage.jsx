import { useState } from "react";
import PortalLayout from "../components/PortalLayout";

export default function ConsultationPage() {
    const [symptoms, setSymptoms] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    const [medications, setMedications] = useState([{ name: "", dosage: "", frequency: "", duration: "" }]);
    const [labTests, setLabTests] = useState([]);
    const [activeSection, setActiveSection] = useState("symptoms");

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

    const sections = [
        { key: "symptoms", label: "Symptoms & Notes", icon: "📝" },
        { key: "diagnosis", label: "Diagnosis", icon: "🩺" },
        { key: "prescription", label: "Prescription", icon: "💊" },
        { key: "lab", label: "Lab Requests", icon: "🧪" },
        { key: "documents", label: "Documents", icon: "📎" },
    ];

    return (
        <PortalLayout title="Consultation Workspace" subtitle="Active Session"
            actions={
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-secondary">Save Draft</button>
                    <button className="btn btn-primary" onClick={() => alert("Consultation saved!")}>Complete & Save</button>
                </div>
            }
        >
            {/* Patient Bar */}
            <div className="p-card animate-in" style={{ marginBottom: 24, padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div className="avatar">SJ</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Sarah Johnson</div>
                        <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>PT0001 · 34y · Female · O+</div>
                    </div>
                    <span className="badge badge-red" style={{ fontSize: 12, padding: "5px 12px" }}>⚠️ Allergic: Penicillin, Sulfa</span>
                    <span className="badge badge-amber">Follow-up Visit</span>
                    <span className="badge badge-blue">09:00 AM</span>
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
                                {[
                                    { label: "Blood Pressure", placeholder: "120/80 mmHg" },
                                    { label: "Heart Rate", placeholder: "72 bpm" },
                                    { label: "Temperature", placeholder: "98.6°F" },
                                ].map(v => (
                                    <div className="p-field" key={v.label}>
                                        <label className="p-label">{v.label}</label>
                                        <input className="p-input" placeholder={v.placeholder} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Diagnosis */}
                    {activeSection === "diagnosis" && (
                        <div className="p-card">
                            <h3 className="p-card-title" style={{ marginBottom: 20 }}>🩺 Diagnosis</h3>
                            <div className="p-field">
                                <label className="p-label">Primary Diagnosis</label>
                                <input className="p-input" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Enter primary diagnosis (e.g., Hypertension Stage 1)..." />
                            </div>
                            <div className="p-field">
                                <label className="p-label">Secondary Diagnosis (optional)</label>
                                <input className="p-input" placeholder="Enter secondary diagnosis if applicable..." />
                            </div>
                            <div className="p-field">
                                <label className="p-label">ICD-10 Code (optional)</label>
                                <input className="p-input" placeholder="e.g., I10" />
                            </div>
                            <div className="p-field">
                                <label className="p-label">Clinical Summary</label>
                                <textarea className="p-textarea p-input" placeholder="Summarize findings & diagnosis rationale..." rows={4} />
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
                            <div style={{ border: "2px dashed var(--p-input-border)", borderRadius: 12, padding: "48px 24px", textAlign: "center", cursor: "pointer", transition: "border-color .2s" }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--p-teal)"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--p-input-border)"}
                            >
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Drop files here or click to upload</div>
                                <div style={{ fontSize: 13, color: "var(--p-text-dim)" }}>Supports PDF, images, and documents up to 10MB</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PortalLayout>
    );
}
