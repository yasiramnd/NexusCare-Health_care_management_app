-- placeholder
-- Orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    prescription_id INT,
    total_price NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id),

    CONSTRAINT fk_order_prescription
        FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id)
);
CREATE TABLE priority_orders (
    order_id INT PRIMARY KEY,
    collecting_time INTERVAL,
    additional_charge NUMERIC(10,2),

    CONSTRAINT fk_priority_order
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
CREATE TABLE normal_orders (
    order_id INT PRIMARY KEY,
    is_prepared BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_normal_order
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
CREATE TABLE recommended_reports (
    report_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    test_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recommended_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id),

    CONSTRAINT fk_recommended_doctor
        FOREIGN KEY (doctor_id) REFERENCES staff(staff_id)
);
CREATE TABLE lab_reports (
    lab_report_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    lab_id INT NOT NULL,
    test_name VARCHAR(100),
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lab_patient
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id),

    CONSTRAINT fk_lab_doctor
        FOREIGN KEY (doctor_id) REFERENCES staff(staff_id),

    CONSTRAINT fk_lab_staff
        FOREIGN KEY (lab_id) REFERENCES staff(staff_id)
);
