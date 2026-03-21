from flask import Blueprint, request, jsonify, g, current_app, send_file
from src.auth_service.auth.middleware import token_required, role_required
from src.auth_service.db.hospital_db import get_hospital_conn, put_hospital_conn
from src.auth_service.db.auth_db import get_auth_conn, put_auth_conn
from src.utils.supabase_storage import (
	SupabaseStorageError,
	download_bytes,
	extract_object_path_from_url,
	upload_bytes,
)
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid
import os
import json
from io import BytesIO
from src.services.lab_upload_ingestion_service import trigger_rag_ingestion_async


lab_bp = Blueprint("lab_bp", __name__)

LAB_STATUSES = {"pending", "accepted", "rejected", "in_progress", "completed", "sent"}
DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def _scalar(cur):
	row = cur.fetchone()
	return row[0] if row else None


def _run(cur, sql, params=None):
	cur.execute(sql, params or ())


def _safe_get(row, idx, default=None):
	if row is None:
		return default
	try:
		return row[idx]
	except (IndexError, TypeError):
		return default


def _ensure_lab_tables(conn):
	"""Create optional lab portal tables if not present to keep the API self-contained."""
	with conn.cursor() as cur:
		_run(
			cur,
			"""
			CREATE TABLE IF NOT EXISTS lab_requests (
				request_id VARCHAR(12) PRIMARY KEY,
				lab_id VARCHAR(12) NOT NULL REFERENCES lab(lab_id) ON DELETE CASCADE,
				patient_id VARCHAR(12) REFERENCES patient(patient_id) ON DELETE CASCADE,
				doctor_id VARCHAR(12) REFERENCES doctor(doctor_id) ON DELETE SET NULL,
				test_name VARCHAR(120) NOT NULL,
				priority VARCHAR(20) NOT NULL DEFAULT 'normal',
				status VARCHAR(20) NOT NULL DEFAULT 'pending',
				notes TEXT,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				report_file_url TEXT,
				report_file_name TEXT,
				report_uploaded_at TIMESTAMPTZ
			)
			""",
		)
		_run(cur, "CREATE INDEX IF NOT EXISTS idx_lab_requests_lab_id ON lab_requests(lab_id)")
		_run(cur, "CREATE INDEX IF NOT EXISTS idx_lab_requests_status ON lab_requests(status)")
		_run(cur, "CREATE INDEX IF NOT EXISTS idx_lab_requests_created_at ON lab_requests(created_at DESC)")

		_run(
			cur,
			"""
			CREATE TABLE IF NOT EXISTS lab_offered_tests (
				test_id VARCHAR(12) PRIMARY KEY,
				lab_id VARCHAR(12) NOT NULL REFERENCES lab(lab_id) ON DELETE CASCADE,
				test_name VARCHAR(120) NOT NULL,
				duration VARCHAR(80),
				sample_type VARCHAR(80),
				category VARCHAR(80),
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
			""",
		)
		_run(cur, "CREATE INDEX IF NOT EXISTS idx_lab_offered_tests_lab_id ON lab_offered_tests(lab_id)")

		_run(
			cur,
			"""
			CREATE TABLE IF NOT EXISTS lab_availability (
				lab_id VARCHAR(12) PRIMARY KEY REFERENCES lab(lab_id) ON DELETE CASCADE,
				schedule_json JSONB NOT NULL DEFAULT '{}'::jsonb,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
			""",
		)


def _get_auth_user_meta(user_id):
	conn = get_auth_conn()
	try:
		with conn.cursor() as cur:
			cur.execute(
				"SELECT email, is_active, username FROM credentials WHERE user_id = %s",
				(user_id,),
			)
			row = cur.fetchone()
			if not row:
				return {"email": None, "is_active": False, "username": None}
			return {"email": row[0], "is_active": bool(row[1]), "username": row[2]}
	finally:
		put_auth_conn(conn)


def _get_auth_email(user_id):
	if not user_id:
		return ""

	conn = get_auth_conn()
	try:
		with conn.cursor() as cur:
			cur.execute("SELECT email FROM credentials WHERE user_id = %s", (user_id,))
			row = cur.fetchone()
			return row[0] if row and row[0] else ""
	finally:
		put_auth_conn(conn)


def _find_auth_user_id_by_email(email):
	email = (email or "").strip()
	if not email:
		return None

	conn = get_auth_conn()
	try:
		with conn.cursor() as cur:
			cur.execute(
				"SELECT user_id FROM credentials WHERE LOWER(email) = LOWER(%s) LIMIT 1",
				(email,),
			)
			row = cur.fetchone()
			return row[0] if row else None
	finally:
		put_auth_conn(conn)


def _get_lab_id(cur, user_id):
	cur.execute("SELECT lab_id FROM lab WHERE user_id = %s", (user_id,))
	row = cur.fetchone()
	return row[0] if row else None


def _ensure_lab_identity(cur, user_id, email=None, username=None):
	display_name = username or (email.split("@")[0] if email else "Lab")

	cur.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
	if not cur.fetchone():
		cur.execute(
			"""
			INSERT INTO users (user_id, name, contact_no1, contact_no2, address)
			VALUES (%s, %s, %s, %s, %s)
			""",
			(user_id, display_name, "", "", ""),
		)

	cur.execute("SELECT lab_id FROM lab WHERE user_id = %s", (user_id,))
	row = cur.fetchone()
	if row:
		return row[0]

	new_lab_id = "LAB" + str(uuid.uuid4().int)[:4]
	cur.execute(
		"""
		INSERT INTO lab (
			lab_id, user_id, license_no, business_registration_number,
			business_registration_url, available_date, available_time, available_tests
		)
		VALUES (%s, %s, %s, %s, %s, CURRENT_DATE, '09:00', %s)
		""",
		(new_lab_id, user_id, "", "", "", "General Tests"),
	)
	return new_lab_id


def _to_status_response(is_active):
	return {"status": "active" if is_active else "pending"}


# POST /api/lab/register-request
@lab_bp.post("/lab/register-request")
def lab_register_request():
	user_id = request.form.get("user_id")
	lab_name = request.form.get("lab_name")
	contact_no1 = request.form.get("contact_no1")
	contact_no2 = request.form.get("contact_no2", "")
	address = request.form.get("address")
	lab_license_no = request.form.get("lab_license_no")
	business_reg_no = request.form.get("business_registration_number")

	if not all([user_id, lab_name, contact_no1, address, lab_license_no, business_reg_no]):
		return jsonify({"error": "Missing required fields"}), 400

	auth_conn = get_auth_conn()
	try:
		with auth_conn.cursor() as cur:
			cur.execute("SELECT role FROM credentials WHERE user_id = %s", (user_id,))
			row = cur.fetchone()
			if not row or row[0] != "LAB":
				return jsonify({"error": "Invalid user_id or not a lab account"}), 400
	finally:
		put_auth_conn(auth_conn)

	business_reg_url = ""
	file = request.files.get("business_registration_doc")
	if file and file.filename:
		filename = secure_filename(file.filename)
		unique_filename = f"{uuid.uuid4().hex}_{filename}"
		upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
		os.makedirs(upload_folder, exist_ok=True)
		file_path = os.path.join(upload_folder, unique_filename)
		file.save(file_path)
		business_reg_url = f"/uploads/{unique_filename}"

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)

			cur.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
			if not cur.fetchone():
				cur.execute(
					"""
					INSERT INTO users (user_id, name, contact_no1, contact_no2, address)
					VALUES (%s, %s, %s, %s, %s)
					""",
					(user_id, lab_name, contact_no1, contact_no2, address),
				)
			else:
				cur.execute(
					"""
					UPDATE users
					SET name = %s,
						contact_no1 = %s,
						contact_no2 = %s,
						address = %s
					WHERE user_id = %s
					""",
					(lab_name, contact_no1, contact_no2, address, user_id),
				)

			cur.execute("SELECT lab_id FROM lab WHERE user_id = %s", (user_id,))
			lab_row = cur.fetchone()
			if not lab_row:
				cur.execute(
					"""
					INSERT INTO lab
						(lab_id, user_id, license_no, business_registration_number,
						 business_registration_url, available_date, available_time,
						 available_tests)
					VALUES (%s, %s, %s, %s, %s, CURRENT_DATE, '09:00', 'General Tests')
					""",
					("LAB" + str(uuid.uuid4().int)[:4], user_id, lab_license_no, business_reg_no, business_reg_url),
				)
			else:
				cur.execute(
					"""
					UPDATE lab
					SET license_no = %s,
						business_registration_number = %s,
						business_registration_url = COALESCE(NULLIF(%s, ''), business_registration_url)
					WHERE user_id = %s
					""",
					(lab_license_no, business_reg_no, business_reg_url, user_id),
				)

			conn.commit()
		return jsonify({"message": "Lab profile created successfully"}), 201
	except Exception as e:
		conn.rollback()
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/me
@lab_bp.get("/lab/me")
@token_required
@role_required(["LAB"])
def get_lab_me():
	user_id = g.user_id
	meta = _get_auth_user_meta(user_id)

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			_ensure_lab_identity(cur, user_id, meta["email"], meta["username"])
			conn.commit()

			payload = _to_status_response(meta["is_active"])
			payload["message"] = "Approved" if meta["is_active"] else "Waiting for admin approval"
			payload["email"] = meta["email"]
			return jsonify(payload)
	except Exception as e:
		conn.rollback()
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/profile
@lab_bp.get("/lab/profile")
@token_required
@role_required(["LAB"])
def get_lab_profile():
	user_id = g.user_id

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			conn.commit()

			cur.execute(
				"""
				SELECT
					u.name,
					u.contact_no1,
					u.address,
					l.business_registration_number,
					l.license_no,
					l.available_tests,
					l.lab_id
				FROM users u
				JOIN lab l ON l.user_id = u.user_id
				WHERE u.user_id = %s
				""",
				(user_id,),
			)
			row = cur.fetchone()
			if not row:
				return jsonify({"error": "Lab profile not found"}), 404

			return jsonify(
				{
					"lab_name": row[0] or "",
					"phone": row[1] or "",
					"address": row[2] or "",
					"reg_no": row[3] or "",
					"license_no": row[4] or "",
					"available_tests": row[5] or "",
					"lab_id": row[6] or lab_id,
				}
			)
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# PUT /api/lab/profile
@lab_bp.put("/lab/profile")
@token_required
@role_required(["LAB"])
def update_lab_profile():
	user_id = g.user_id
	data = request.get_json(silent=True) or {}

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			_ensure_lab_identity(cur, user_id)

			cur.execute(
				"""
				UPDATE users
				SET name = COALESCE(%s, name),
					contact_no1 = COALESCE(%s, contact_no1),
					address = COALESCE(%s, address)
				WHERE user_id = %s
				""",
				(data.get("lab_name"), data.get("phone"), data.get("address"), user_id),
			)

			cur.execute(
				"""
				UPDATE lab
				SET business_registration_number = COALESCE(%s, business_registration_number),
					license_no = COALESCE(%s, license_no),
					available_tests = COALESCE(%s, available_tests)
				WHERE user_id = %s
				""",
				(data.get("reg_no"), data.get("license_no"), data.get("available_tests"), user_id),
			)

			conn.commit()
			return jsonify({"message": "Profile updated successfully"})
	except Exception as e:
		conn.rollback()
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/stats
@lab_bp.get("/lab/stats")
@token_required
@role_required(["LAB"])
def get_lab_stats():
	user_id = g.user_id
	conn = get_hospital_conn()

	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			conn.commit()

			cur.execute(
				"""
				SELECT
					COUNT(*) AS total,
					COUNT(*) FILTER (WHERE status = 'pending') AS pending,
					COUNT(*) FILTER (WHERE status = 'accepted') AS accepted,
					COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
					COUNT(*) FILTER (WHERE status = 'completed') AS completed,
					COUNT(*) FILTER (WHERE status = 'sent') AS sent,
					COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
				FROM lab_requests
				WHERE lab_id = %s
				""",
				(lab_id,),
			)
			row = cur.fetchone() or (0, 0, 0, 0, 0, 0, 0)
			return jsonify(
				{
					"total": row[0],
					"pending": row[1],
					"accepted": row[2],
					"in_progress": row[3],
					"completed": row[4],
					"sent": row[5],
					"rejected": row[6],
				}
			)
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


def _seed_requests_if_empty(cur, lab_id):
	cur.execute("SELECT COUNT(*) FROM lab_requests WHERE lab_id = %s", (lab_id,))
	count = cur.fetchone()[0] or 0
	if count > 0:
		return

	cur.execute(
		"""
		SELECT
			p.patient_id,
			u.name,
			c.email
		FROM patient p
		JOIN users u ON p.user_id = u.user_id
		LEFT JOIN credentials c ON c.user_id = u.user_id
		ORDER BY u.created_at DESC
		LIMIT 5
		"""
	)
	patients = cur.fetchall() or []
	now = datetime.utcnow()

	for idx, p in enumerate(patients):
		request_id = "LRQ" + str(uuid.uuid4().int)[:5]
		test_name = ["CBC", "Urine Routine", "Lipid Profile", "LFT", "FBS"][idx % 5]
		priority = ["normal", "urgent", "normal", "high", "normal"][idx % 5]
		created_at = now
		cur.execute(
			"""
			INSERT INTO lab_requests (
				request_id, lab_id, patient_id, test_name, priority, status, notes, created_at, updated_at
			)
			VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s)
			""",
			(
				request_id,
				lab_id,
				p[0],
				test_name,
				priority,
				f"Auto-seeded request for {p[1] or 'patient'}",
				created_at,
				created_at,
			),
		)


def _extract_requested_tests(notes):
	if not notes:
		return []

	items = []
	for line in str(notes).splitlines():
		marker = "Lab Tests Requested:"
		if marker not in line:
			continue
		raw = line.split(marker, 1)[1].strip()
		if not raw:
			continue
		for part in raw.split(","):
			test_name = part.strip()
			if test_name and test_name not in items:
				items.append(test_name)
	return items


def _backfill_lab_requests_from_consultations(cur, lab_id, patient_id=None):
	params = ["%Lab Tests Requested:%"]
	where = "WHERE mr.notes ILIKE %s"
	if patient_id:
		where += " AND mr.patient_id = %s"
		params.append(patient_id)

	cur.execute(
		f"""
		SELECT mr.record_id, mr.patient_id, mr.doctor_id, mr.notes, mr.created_at
		FROM medical_record mr
		{where}
		ORDER BY mr.created_at DESC
		LIMIT 300
		""",
		tuple(params),
	)
	records = cur.fetchall() or []

	for rec in records:
		record_id, rec_patient_id, rec_doctor_id, rec_notes, rec_created_at = rec
		tests = _extract_requested_tests(rec_notes)
		if not tests:
			continue

		for test_name in tests:
			cur.execute(
				"""
				SELECT 1
				FROM lab_requests
				WHERE lab_id = %s
				  AND patient_id = %s
				  AND doctor_id = %s
				  AND test_name = %s
				  AND notes ILIKE %s
				LIMIT 1
				""",
				(
					lab_id,
					rec_patient_id,
					rec_doctor_id,
					test_name,
					f"%consultation {record_id}%",
				),
			)
			if cur.fetchone():
				continue

			request_id = "LRQ" + uuid.uuid4().hex[:7].upper()
			cur.execute(
				"""
				INSERT INTO lab_requests (
					request_id, lab_id, patient_id, doctor_id,
					test_name, priority, status, notes, created_at, updated_at
				)
				VALUES (%s, %s, %s, %s, %s, 'normal', 'pending', %s, %s, NOW())
				""",
				(
					request_id,
					lab_id,
					rec_patient_id,
					rec_doctor_id,
					test_name,
					f"Backfilled from consultation {record_id}",
					rec_created_at,
				),
			)


# GET /api/lab/requests
@lab_bp.get("/lab/requests")
@token_required
@role_required(["LAB"])
def get_lab_requests():
	user_id = g.user_id
	status = (request.args.get("status") or "all").strip().lower()

	if status != "all" and status not in LAB_STATUSES:
		return jsonify({"error": "Invalid status filter"}), 400

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			_backfill_lab_requests_from_consultations(cur, lab_id)
			conn.commit()

			where = "WHERE lr.lab_id = %s AND lr.doctor_id IS NOT NULL"
			args = [lab_id]
			if status != "all":
				where += " AND lr.status = %s"
				args.append(status)

			cur.execute(
				f"""
				SELECT
					lr.request_id,
					COALESCE(u.name, 'Unknown Patient') AS patient_name,
					COALESCE(p.user_id, '') AS patient_user_id,
					lr.test_name,
					lr.priority,
					lr.status,
					lr.created_at,
					lr.patient_id,
					lr.notes
				FROM lab_requests lr
				LEFT JOIN patient p ON p.patient_id = lr.patient_id
				LEFT JOIN users u ON u.user_id = p.user_id
				{where}
				ORDER BY lr.created_at DESC
				""",
				tuple(args),
			)
			rows = cur.fetchall() or []

			data = []
			for r in rows:
				patient_email = _get_auth_email(r[2]) if r[2] else ""
				data.append(
					{
						"id": r[0],
						"patient_name": r[1],
						"patient_email": patient_email,
						"test_name": r[3],
						"priority": r[4],
						"status": r[5],
						"created_at": r[6].isoformat() if r[6] else None,
						"patient_id": r[7],
						"notes": r[8],
					}
				)
			return jsonify(data)
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# PUT /api/lab/requests/<request_id>/status
@lab_bp.put("/lab/requests/<request_id>/status")
@token_required
@role_required(["LAB"])
def update_lab_request_status(request_id):
	user_id = g.user_id
	body = request.get_json(silent=True) or {}
	next_status = (body.get("status") or "").strip().lower()

	if next_status not in LAB_STATUSES:
		return jsonify({"error": "Invalid status"}), 400

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			cur.execute(
				"""
				UPDATE lab_requests
				SET status = %s,
					updated_at = NOW()
				WHERE request_id = %s AND lab_id = %s
				RETURNING request_id, status
				""",
				(next_status, request_id, lab_id),
			)
			row = cur.fetchone()
			if not row:
				return jsonify({"error": "Request not found"}), 404

			conn.commit()
			return jsonify({"message": "Request updated", "id": row[0], "status": row[1]})
	except Exception as e:
		conn.rollback()
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# POST /api/lab/requests/<request_id>/upload-report
@lab_bp.post("/lab/requests/<request_id>/upload-report")
@token_required
@role_required(["LAB"])
def upload_lab_report(request_id):
	user_id = g.user_id
	file = request.files.get("file")
	if not file or not file.filename:
		return jsonify({"error": "No file uploaded"}), 400

	name = file.filename.lower()
	if not name.endswith(".pdf"):
		return jsonify({"error": "Only PDF files are allowed"}), 400

	max_mb = int(current_app.config.get("MAX_REPORT_UPLOAD_MB", 20))
	size_mb = (request.content_length or 0) / (1024 * 1024)
	if size_mb > max_mb:
		return jsonify({"error": f"File is too large. Max {max_mb}MB"}), 400

	safe_name = secure_filename(file.filename)
	stored_name = f"{uuid.uuid4().hex}_{safe_name}"
	object_path = f"lab-reports/{request_id}/{stored_name}"
	try:
		file_url = upload_bytes("lab-report", object_path, file.read(), "application/pdf")
	except SupabaseStorageError as e:
		return jsonify({"error": str(e)}), 500

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)


			# Fetch patient_id and test_name for this request
			cur.execute(
				"""
				SELECT patient_id, test_name
				FROM lab_requests
				WHERE request_id = %s AND lab_id = %s
				""",
				(request_id, lab_id),
			)
			req_row = cur.fetchone()
			patient_id = req_row[0] if req_row else None
			test_name = req_row[1] if req_row else None

			cur.execute(
				"""
				UPDATE lab_requests
				SET report_file_url = %s,
					report_file_name = %s,
					report_uploaded_at = NOW(),
					status = 'completed',
					updated_at = NOW()
				WHERE request_id = %s AND lab_id = %s
				RETURNING request_id
				""",
				(file_url, safe_name, request_id, lab_id),
			)
			row = cur.fetchone()
			if not row:
				return jsonify({"error": "Request not found"}), 404

			conn.commit()

			# Trigger RAG ingestion in background thread (non-blocking)
			if patient_id:
				trigger_rag_ingestion_async(
					file_url=file_url,
					patient_id=patient_id,
					request_id=request_id,
					test_name=test_name or "Lab Report",
				)

			return jsonify({
				"message": "Report uploaded",
				"request_id": row[0],
				"file_url": file_url,
				"rag_status": "processing" if patient_id else "skipped"
			})
	except Exception as e:
		conn.rollback()
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/reports
@lab_bp.get("/lab/reports")
@token_required
@role_required(["LAB"])
def get_lab_reports():
	user_id = g.user_id
	conn = get_hospital_conn()

	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			cur.execute(
				"""
				SELECT
					request_id,
					report_file_name,
					report_file_url,
					report_uploaded_at
				FROM lab_requests
				WHERE lab_id = %s
				  AND report_file_url IS NOT NULL
				ORDER BY report_uploaded_at DESC NULLS LAST
				""",
				(lab_id,),
			)
			rows = cur.fetchall() or []

			return jsonify(
				[
					{
						"id": r[0],
						"request_id": r[0],
						"file_name": r[1],
						"file_url": r[2],
						"uploaded_at": r[3].isoformat() if r[3] else None,
					}
					for r in rows
				]
			)
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/reports/<report_id>/download
@lab_bp.get("/lab/reports/<report_id>/download")
@token_required
@role_required(["LAB"])
def download_lab_report(report_id):
	user_id = g.user_id
	conn = get_hospital_conn()

	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			cur.execute(
				"""
				SELECT report_file_name, report_file_url
				FROM lab_requests
				WHERE request_id = %s AND lab_id = %s
				""",
				(report_id, lab_id),
			)
			row = cur.fetchone()
			if not row or not row[1]:
				return jsonify({"error": "Report not found"}), 404

			file_url = row[1]

			# Backward compatibility for previously stored local files.
			if file_url.startswith("/uploads/"):
				rel_path = file_url.replace("/uploads/", "", 1)
				abs_path = os.path.join(current_app.config.get("UPLOAD_FOLDER", "uploads"), rel_path)
				if not os.path.exists(abs_path):
					return jsonify({"error": "File missing on server"}), 404

				return send_file(
					abs_path,
					as_attachment=True,
					download_name=row[0] or f"report_{report_id}.pdf",
					mimetype="application/pdf",
				)

			object_path = extract_object_path_from_url("lab-report", file_url)
			if not object_path:
				return jsonify({"error": "Unsupported report URL format"}), 500

			try:
				file_bytes, content_type = download_bytes("lab-report", object_path)
			except SupabaseStorageError as e:
				return jsonify({"error": str(e)}), 500

			return send_file(
				BytesIO(file_bytes),
				as_attachment=True,
				download_name=row[0] or f"report_{report_id}.pdf",
				mimetype=content_type or "application/pdf",
			)
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/recommended-tests
@lab_bp.get("/lab/recommended-tests")
@token_required
@role_required(["LAB"])
def get_recommended_tests():
	user_id = g.user_id
	conn = get_hospital_conn()

	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)

			cur.execute(
				"""
				SELECT test_name, COUNT(*)
				FROM lab_requests
				WHERE lab_id = %s
				GROUP BY test_name
				ORDER BY COUNT(*) DESC, test_name ASC
				LIMIT 15
				""",
				(lab_id,),
			)
			rows = cur.fetchall() or []
			data = [{"test_name": r[0], "count": r[1]} for r in rows]

			if not data:
				data = [
					{"test_name": "Complete Blood Count (CBC)", "count": 0},
					{"test_name": "Urine Full Report", "count": 0},
					{"test_name": "Lipid Profile", "count": 0},
				]
			return jsonify(data)
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/tests
@lab_bp.get("/lab/tests")
@token_required
@role_required(["LAB"])
def get_offered_tests():
	user_id = g.user_id
	conn = get_hospital_conn()

	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			cur.execute(
				"""
				SELECT test_id, test_name, duration, sample_type, category, created_at
				FROM lab_offered_tests
				WHERE lab_id = %s
				ORDER BY created_at DESC
				""",
				(lab_id,),
			)
			rows = cur.fetchall() or []
			return jsonify(
				[
					{
						"id": r[0],
						"test_name": r[1],
						"duration": r[2],
						"sample_type": r[3],
						"category": r[4],
						"created_at": r[5].isoformat() if r[5] else None,
					}
					for r in rows
				]
			)
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# POST /api/lab/tests
@lab_bp.post("/lab/tests")
@token_required
@role_required(["LAB"])
def add_offered_test():
	user_id = g.user_id
	body = request.get_json(silent=True) or {}
	test_name = (body.get("test_name") or "").strip()
	if not test_name:
		return jsonify({"error": "test_name is required"}), 400

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			test_id = "LBT" + str(uuid.uuid4().int)[:5]

			cur.execute(
				"""
				INSERT INTO lab_offered_tests (test_id, lab_id, test_name, duration, sample_type, category)
				VALUES (%s, %s, %s, %s, %s, %s)
				RETURNING test_id
				""",
				(
					test_id,
					lab_id,
					test_name,
					body.get("duration"),
					body.get("sample_type"),
					body.get("category"),
				),
			)
			row = cur.fetchone()
			conn.commit()
			return jsonify({"message": "Test added", "id": row[0]}), 201
	except Exception as e:
		conn.rollback()
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# DELETE /api/lab/tests/<test_id>
@lab_bp.delete("/lab/tests/<test_id>")
@token_required
@role_required(["LAB"])
def delete_offered_test(test_id):
	user_id = g.user_id
	conn = get_hospital_conn()

	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			cur.execute(
				"""
				DELETE FROM lab_offered_tests
				WHERE test_id = %s AND lab_id = %s
				RETURNING test_id
				""",
				(test_id, lab_id),
			)
			row = cur.fetchone()
			if not row:
				return jsonify({"error": "Test not found"}), 404

			conn.commit()
			return jsonify({"message": "Deleted", "id": row[0]})
	except Exception as e:
		conn.rollback()
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/availability
@lab_bp.get("/lab/availability")
@token_required
@role_required(["LAB"])
def get_lab_availability():
	user_id = g.user_id
	conn = get_hospital_conn()

	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			cur.execute("SELECT schedule_json FROM lab_availability WHERE lab_id = %s", (lab_id,))
			row = cur.fetchone()

			schedule = row[0] if row and row[0] else {}
			if not schedule:
				schedule = {
					"mon": {"open": "08:00", "close": "17:00", "notes": ""},
					"tue": {"open": "08:00", "close": "17:00", "notes": ""},
					"wed": {"open": "08:00", "close": "17:00", "notes": ""},
					"thu": {"open": "08:00", "close": "17:00", "notes": ""},
					"fri": {"open": "08:00", "close": "17:00", "notes": ""},
					"sat": {"open": "08:00", "close": "13:00", "notes": ""},
					"sun": {"open": "", "close": "", "notes": "Closed"},
				}
			return jsonify({"schedule": schedule})
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# PUT /api/lab/availability
@lab_bp.put("/lab/availability")
@token_required
@role_required(["LAB"])
def update_lab_availability():
	user_id = g.user_id
	body = request.get_json(silent=True) or {}
	schedule = body.get("schedule")
	if not isinstance(schedule, dict):
		return jsonify({"error": "schedule must be an object"}), 400

	normalized = {}
	for key in DAY_KEYS:
		day = schedule.get(key, {}) if isinstance(schedule.get(key, {}), dict) else {}
		normalized[key] = {
			"open": (day.get("open") or "").strip(),
			"close": (day.get("close") or "").strip(),
			"notes": (day.get("notes") or "").strip(),
			"_closed": bool(day.get("_closed", False)),
		}

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			cur.execute(
				"""
				INSERT INTO lab_availability (lab_id, schedule_json, updated_at)
				VALUES (%s, %s::jsonb, NOW())
				ON CONFLICT (lab_id)
				DO UPDATE SET schedule_json = EXCLUDED.schedule_json,
							  updated_at = NOW()
				""",
				(lab_id, json.dumps(normalized)),
			)
			conn.commit()
			return jsonify({"message": "Availability updated"})
	except Exception as e:
		conn.rollback()
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/patient/lookup?qr=<patient_id_or_qr_or_email>
@lab_bp.get("/lab/patient/lookup")
@token_required
@role_required(["LAB"])
def lookup_patient():
	user_id = g.user_id
	q = (request.args.get("qr") or "").strip()
	if not q:
		return jsonify({"error": "Patient QR / ID / email is required"}), 400

	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)

			cur.execute(
				"""
				SELECT
					p.patient_id,
					p.user_id,
					p.qr_code,
					u.name,
					u.contact_no1,
					u.address,
					p.gender,
					p.date_of_birth,
					ep.blood_group,
					ep.allergies,
					ep.chronic_conditions
				FROM patient p
				JOIN users u ON u.user_id = p.user_id
				LEFT JOIN emergency_profile ep ON ep.patient_id = p.patient_id
				WHERE p.patient_id = %s
				   OR p.qr_code = %s
				LIMIT 1
				""",
				(q, q),
			)
			row = cur.fetchone()

			if not row and "@" in q:
				auth_user_id = _find_auth_user_id_by_email(q)
				if auth_user_id:
					cur.execute(
						"""
						SELECT
							p.patient_id,
							p.user_id,
							p.qr_code,
							u.name,
							u.contact_no1,
							u.address,
							p.gender,
							p.date_of_birth,
							ep.blood_group,
							ep.allergies,
							ep.chronic_conditions
						FROM patient p
						JOIN users u ON u.user_id = p.user_id
						LEFT JOIN emergency_profile ep ON ep.patient_id = p.patient_id
						WHERE p.user_id = %s
						LIMIT 1
						""",
						(auth_user_id,),
					)
					row = cur.fetchone()

			if not row:
				return jsonify({"error": "Patient not found"}), 404

			patient_id = _safe_get(row, 0)
			user_id_for_patient = _safe_get(row, 1)

			_backfill_lab_requests_from_consultations(cur, lab_id, patient_id)
			conn.commit()

			email = _get_auth_email(user_id_for_patient)

			cur.execute("SELECT MAX(created_at) FROM medical_record WHERE patient_id = %s", (patient_id,))
			last_visit = _scalar(cur)

			cur.execute(
				"""
				SELECT COUNT(*)
				FROM lab_requests
				WHERE patient_id = %s
				  AND lab_id = %s
				  AND doctor_id IS NOT NULL
				""",
				(patient_id, lab_id),
			)
			requests_count = _scalar(cur) or 0

			return jsonify(
				{
					"patient_id": _safe_get(row, 0),
					"user_id": _safe_get(row, 1),
					"qr_code": _safe_get(row, 2),
					"name": _safe_get(row, 3),
					"contact_no": _safe_get(row, 4),
					"address": _safe_get(row, 5),
					"gender": _safe_get(row, 6),
					"date_of_birth": _safe_get(row, 7).isoformat() if _safe_get(row, 7) else None,
					"blood_group": _safe_get(row, 8),
					"allergies": _safe_get(row, 9),
					"chronic_conditions": _safe_get(row, 10),
					"email": email,
					"last_visit": last_visit.isoformat() if last_visit else None,
					"lab_requests": requests_count,
				}
			)
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)


# GET /api/lab/patient/<patient_id>/history
@lab_bp.get("/lab/patient/<patient_id>/history")
@token_required
@role_required(["LAB"])
def patient_lab_history(patient_id):
	user_id = g.user_id
	conn = get_hospital_conn()
	try:
		with conn.cursor() as cur:
			_ensure_lab_tables(conn)
			lab_id = _ensure_lab_identity(cur, user_id)
			_backfill_lab_requests_from_consultations(cur, lab_id, patient_id)
			conn.commit()
			cur.execute(
				"""
				SELECT request_id, test_name, priority, status, created_at, report_uploaded_at
				FROM lab_requests
				WHERE patient_id = %s
				  AND lab_id = %s
				  AND doctor_id IS NOT NULL
				ORDER BY created_at DESC
				""",
				(patient_id, lab_id),
			)
			rows = cur.fetchall() or []
			history = [
				{
					"id": _safe_get(r, 0),
					"test_name": _safe_get(r, 1),
					"priority": _safe_get(r, 2),
					"status": _safe_get(r, 3),
					"created_at": _safe_get(r, 4).isoformat() if _safe_get(r, 4) else None,
					"report_uploaded_at": _safe_get(r, 5).isoformat() if _safe_get(r, 5) else None,
				}
				for r in rows
			]
			return jsonify({"history": history})
	except Exception as e:
		return jsonify({"error": str(e)}), 500
	finally:
		put_hospital_conn(conn)
