// ── NexusCare Data Models ─────────────────────────────────────────────────────
// Type-safe wrappers around the JSON responses from the Flask backend.

class NexusUser {
  final String userId;
  final String role;
  final String? name;

  const NexusUser({required this.userId, required this.role, this.name});

  factory NexusUser.fromJson(Map<String, dynamic> j) => NexusUser(
    userId: j['user_id'] ?? '',
    role:   j['role']    ?? 'PATIENT',
    name:   j['name'],
  );
}

// ─────────────────────────────────────────────────────────────────────────────

class MedicalRecord {
  final String  recordId;
  final String  patientId;
  final String  doctorName;
  final String  date;
  final String  diagnosis;
  final String  notes;
  final String  hospital;

  const MedicalRecord({
    required this.recordId, required this.patientId, required this.doctorName,
    required this.date,     required this.diagnosis,  required this.notes,
    required this.hospital,
  });

  factory MedicalRecord.fromJson(Map<String, dynamic> j) => MedicalRecord(
    recordId:   j['record_id']   ?? '',
    patientId:  j['patient_id']  ?? '',
    doctorName: j['doctor_name'] ?? '',
    date:       j['date']        ?? '',
    diagnosis:  j['diagnosis']   ?? '',
    notes:      j['notes']       ?? '',
    hospital:   j['hospital']    ?? '',
  );
}

// ─────────────────────────────────────────────────────────────────────────────

class Medication {
  final String name;
  final String dosage;
  final String frequency;
  final String duration;

  const Medication({required this.name, required this.dosage,
                    required this.frequency, required this.duration});

  factory Medication.fromJson(Map<String, dynamic> j) => Medication(
    name:      j['name']      ?? '',
    dosage:    j['dosage']    ?? '',
    frequency: j['frequency'] ?? '',
    duration:  j['duration']  ?? '',
  );
}

class Prescription {
  final String       prescriptionId;
  final String       patientId;
  final String       doctorName;
  final String       dateIssued;
  final String       status;
  final List<Medication> medications;

  const Prescription({
    required this.prescriptionId, required this.patientId,
    required this.doctorName,     required this.dateIssued,
    required this.status,         required this.medications,
  });

  factory Prescription.fromJson(Map<String, dynamic> j) => Prescription(
    prescriptionId: j['prescription_id'] ?? '',
    patientId:      j['patient_id']      ?? '',
    doctorName:     j['doctor_name']     ?? '',
    dateIssued:     j['date_issued']     ?? '',
    status:         j['status']          ?? '',
    medications: (j['medications'] as List? ?? [])
        .map((m) => Medication.fromJson(m as Map<String, dynamic>))
        .toList(),
  );

  bool get isActive => status == 'ACTIVE';
}

// ─────────────────────────────────────────────────────────────────────────────

class LabReport {
  final String              reportId;
  final String              patientId;
  final String              testName;
  final String              orderedBy;
  final String              date;
  final String              status;
  final String              labName;
  final Map<String, String> results;
  final String?             fileUrl;

  const LabReport({
    required this.reportId,  required this.patientId,  required this.testName,
    required this.orderedBy, required this.date,        required this.status,
    required this.labName,   required this.results,    this.fileUrl,
  });

  factory LabReport.fromJson(Map<String, dynamic> j) => LabReport(
    reportId:  j['report_id']   ?? '',
    patientId: j['patient_id']  ?? '',
    testName:  j['test_name']   ?? '',
    orderedBy: j['ordered_by']  ?? '',
    date:      j['date']        ?? '',
    status:    j['status']      ?? '',
    labName:   j['lab_name']    ?? '',
    results:   Map<String, String>.from(
      (j['results'] as Map<String, dynamic>? ?? {}).map(
          (k, v) => MapEntry(k, v.toString()))),
    fileUrl:   j['file_url'],
  );

  bool get isPending   => status == 'PENDING';
  bool get isCompleted => status == 'COMPLETED';
}

// ─────────────────────────────────────────────────────────────────────────────

class DoctorSlot {
  final String       slotId;
  final String       doctorId;
  final String       doctorName;
  final String       specialization;
  final String       date;
  final List<String> timeSlots;

  const DoctorSlot({
    required this.slotId,          required this.doctorId,
    required this.doctorName,      required this.specialization,
    required this.date,            required this.timeSlots,
  });

  factory DoctorSlot.fromJson(Map<String, dynamic> j) => DoctorSlot(
    slotId:         j['slot_id']         ?? '',
    doctorId:       j['doctor_id']       ?? '',
    doctorName:     j['doctor_name']     ?? '',
    specialization: j['specialization']  ?? '',
    date:           j['date']            ?? '',
    timeSlots: List<String>.from(j['time_slots'] ?? []),
  );
}

// ─────────────────────────────────────────────────────────────────────────────

class EmergencyContact {
  final String name;
  final String relation;
  final String phone;

  const EmergencyContact({required this.name, required this.relation, required this.phone});

  factory EmergencyContact.fromJson(Map<String, dynamic> j) => EmergencyContact(
    name:     j['name']     ?? '',
    relation: j['relation'] ?? '',
    phone:    j['phone']    ?? '',
  );
}

class EmergencyProfile {
  final String                 patientName;
  final String                 bloodType;
  final List<String>           allergies;
  final List<String>           chronicConditions;
  final List<String>           currentMedications;
  final List<EmergencyContact> emergencyContacts;
  final String                 criticalNotes;

  const EmergencyProfile({
    required this.patientName,        required this.bloodType,
    required this.allergies,          required this.chronicConditions,
    required this.currentMedications, required this.emergencyContacts,
    required this.criticalNotes,
  });

  factory EmergencyProfile.fromJson(Map<String, dynamic> j) => EmergencyProfile(
    patientName:        j['patient_name']        ?? '',
    bloodType:          j['blood_type']           ?? '',
    allergies:          List<String>.from(j['allergies']           ?? []),
    chronicConditions:  List<String>.from(j['chronic_conditions']  ?? []),
    currentMedications: List<String>.from(j['current_medications'] ?? []),
    emergencyContacts: (j['emergency_contacts'] as List? ?? [])
        .map((c) => EmergencyContact.fromJson(c as Map<String, dynamic>))
        .toList(),
    criticalNotes: j['critical_notes'] ?? '',
  );
}

// ─────────────────────────────────────────────────────────────────────────────

class MedicineOrder {
  final String  orderId;
  final String  patientId;
  final String  prescriptionId;
  final String  pharmacyId;
  final bool    priority;
  final String? pickupTime;
  final String  status;

  const MedicineOrder({
    required this.orderId,        required this.patientId,
    required this.prescriptionId, required this.pharmacyId,
    required this.priority,       required this.status,
    this.pickupTime,
  });

  factory MedicineOrder.fromJson(Map<String, dynamic> j) => MedicineOrder(
    orderId:        j['order_id']        ?? '',
    patientId:      j['patient_id']      ?? '',
    prescriptionId: j['prescription_id'] ?? '',
    pharmacyId:     j['pharmacy_id']     ?? '',
    priority:       j['priority']        ?? false,
    pickupTime:     j['pickup_time'],
    status:         j['status']          ?? '',
  );
}
