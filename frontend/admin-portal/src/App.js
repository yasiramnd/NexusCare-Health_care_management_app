import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import logo from "./assets/logo.jpeg";

const API_BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const apiUrl = (path) => `${API_BASE_URL}${path}`;

/* ================= SIDEBAR ================= */

function Sidebar({ setPage, page }) {
  return (
    <div className="sidebar">
      <h2 className="logo">NexusCare Admin</h2>
      <ul className="menu">
        <li
          className={page === "dashboard" ? "active" : ""}
          onClick={() => setPage("dashboard")}
        >
          Dashboard
        </li>

        <li
          className={page === "requests" ? "active" : ""}
          onClick={() => setPage("requests")}
        >
          Registration Requests
        </li>

        <li
          className={page === "users" ? "active" : ""}
          onClick={() => setPage("users")}>
            Manage User Accounts
        </li>
        <li>System Settings</li>
      </ul>
    </div>
  );
}

/* ================= TOPBAR ================= */

function Topbar() {
  return (
    <div className="topbar">
      <div className="admin-name">
        Welcome, Super Admin
      </div>

      <div className="topbar-logo">
        <img src={logo} alt="Nexus Care Logo" />
      </div>
    </div>
  );
}

/* ================= STATUS BADGE ================= */

function StatusBadge({ status }) {
  const safeStatus = status ? status : "Active";
  return (
    <span className={`status ${safeStatus.toLowerCase()}`}>
      {safeStatus}
    </span>
  );
}

/* ================= DASHBOARD ================= */

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(apiUrl("/admin/dashboard"))
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized or Error");
        return res.json();
      })
      .then(data => {
        setStats({
          totalPatients: data.totalPatients || 0,
          totalDoctors: data.totalDoctors || 0,
          pendingRequests: data.pendingRequests || 0,
          totalPharmacies: data.totalPharmacies || 0,
          totalLabs: data.totalLabs || 0,
          totalAppointments: data.totalAppointments || 0
        });
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
      });
  }, []);

  if (!stats) return <Loader />;

  const now = new Date();
  const formattedDate = now.toLocaleString();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>System Dashboard</h1>
          <p>Overview of healthcare facility operations and statistics.</p>
        </div>
        <div className="updated">
          Last updated: {formattedDate}
        </div>
      </div>

      <div className="cards">

        <div className="card">
          <div className="card-header">
            <p>Total Patients</p>
            <div className="card-icon">👥</div>
          </div>
          <h2>{stats.totalPatients}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <p>Pending Requests</p>
            <div className="card-icon">➕</div>
          </div>
          <h2>{stats.pendingRequests}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <p>Total Doctors</p>
            <div className="card-icon">🩺</div>
          </div>
          <h2>{stats.totalDoctors}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <p>Total Pharmacies</p>
            <div className="card-icon">💊</div>
          </div>
          <h2>{stats.totalPharmacies}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <p>Total Labs</p>
            <div className="card-icon">🧪</div>
          </div>
          <h2>{stats.totalLabs}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <p>Total Appointments</p>
            <div className="card-icon">📅</div>
          </div>
          <h2>{stats.totalAppointments}</h2>
        </div>

      </div>
    </div>
  );
}


/* ================= REGISTRATION REQUESTS ================= */

function RegistrationRequests() {
  const [activeTab, setActiveTab] = useState("doctor");
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  

  const fetchData = useCallback(() => {
    const endpoint =
      activeTab === "doctor"
        ? "doctors"
        : activeTab === "lab"
        ? "labs"
        : "pharmacies";

    setLoading(true);

    fetch(apiUrl(`/admin/${endpoint}`))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setData(data);
        } else {
          console.error("Unexpected response:", data);
          setData([]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="content">
      <h1>Registration Requests</h1>

      <div className="tabs">
        <button
          className={activeTab === "doctor" ? "active-tab" : ""}
          onClick={() => setActiveTab("doctor")}
        >
          Doctors
        </button>

        <button
          className={activeTab === "lab" ? "active-tab" : ""}
          onClick={() => setActiveTab("lab")}
        >
          Labs
        </button>

        <button
          className={activeTab === "pharmacy" ? "active-tab" : ""}
          onClick={() => setActiveTab("pharmacy")}
        >
          Pharmacies
        </button>
      </div>

      <div className="table">
        {loading && (
          <div className="table-loader">
            <div className="table-spinner"></div>
            <p>Loading Requests...</p>
          </div>
        )}
        <div className="table-header">
          <span>Entity</span>
          <span>License Number</span>
          <span>Status</span>
          <span> </span>
        </div>

        {Array.isArray(data) && data.map(item => (
          <div key={item.id} className="table-row">
            <span>{item.name}</span>
            <span>{item.license}</span>
            <StatusBadge status={item.status} />
            <button onClick={() => setSelected(item)}>
              View Details
            </button>
          </div>
        ))}
      </div>

      <Modal
        item={selected}
        onClose={() => setSelected(null)}
        role={activeTab}
        refresh={fetchData}
      />
    </div>
  );

  function Modal({ item, onClose, role, refresh }) {
  if (!item) return null;

  const updateStatus = (status) => {
    fetch(
      apiUrl(`/admin/update/${role}/${item.id}/${status}`),
      { method: "POST" }
    )
      .then(res => res.json())
      .then(() => {
        refresh();
        onClose();
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
  <button className="close" onClick={onClose}>✕</button>

  <h2>{item.name}</h2>
  <p className="sub">{item.type || "Professional"}</p>

  <div className="modal-grid">

  {item.license && (
    <p><strong>License:</strong> {item.license}</p>
  )}

  {item.gender && (
    <p><strong>Gender:</strong> {item.gender}</p>
  )}

  {item.nic_no && (
    <p><strong>NIC No:</strong> {item.nic_no}</p>
  )}

  {item.contact_no1 && (
    <p><strong>Contact No 1:</strong> {item.contact_no1}</p>
  )}

  {item.contact_no2 && (
    <p><strong>Contact No 2:</strong> {item.contact_no2}</p>
  )}

  {item.address && (
    <p><strong>Address:</strong> {item.address}</p>
  )}

  {item.available_tests && (
    <p><strong>Available Tests:</strong> {item.available_tests}</p>
  )}

  {item.status && (
    <p><strong>Status:</strong> {item.status}</p>
  )}

  {item.br_no && (
    <p><strong>Business Registration Number:</strong> {item.br_no}</p>
  )}

  {item.br_url && (
    <p>
      <strong>Business Registration Certificate:</strong>{" "}
      <a href={item.br_url} target="_blank" rel="noopener noreferrer">
        View Certificate
      </a>
    </p>
  )}

  {item.imageURL && (
    <p>
      <strong>Profile Image:</strong>{" "}
      <a href={item.imageURL} target="_blank" rel="noopener noreferrer">
        View Image
      </a>
    </p>
  )}

  {item.certificationURL && (
    <p>
      <strong>Certification:</strong>{" "}
      <a href={item.certificationURL} target="_blank" rel="noopener noreferrer">
        View Certification
      </a>
    </p>
  )}

</div>

        <div className="modal-actions">
          <button
            className="reject"
            onClick={() => updateStatus("Rejected")}
          >
            Reject Request
          </button>

          <button
            className="approve"
            onClick={() => updateStatus("Approved")}
          >
            Approve Registration
          </button>
        </div>
      </div>
    </div>
  );
}
}




function ManageUsers() {
  const [activeTab, setActiveTab] = useState("patient");
  const [users, setUsers] = useState([]);
  const [details, setDetails] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);


const deleteUser = async (userId) => {

  await fetch(apiUrl(`/admin/delete-login/${userId}`), {
    method: "DELETE"
  });
  setShowDeleteConfirm(false);
};

  const fetchUsers = useCallback(() => {
    setLoading(true);

    fetch(apiUrl(`/admin/users/${activeTab}`))
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const fetchDetails = (userId) => {
  setLoading(true);

  fetch(apiUrl(`/admin/user-details/${activeTab}/${userId}`))
    .then(res => res.json())
    .then(data => setDetails(data))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
};

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="content">
      <h1>Manage User Accounts</h1>

      <div className="tabs">
        <button
          className={activeTab === "patient" ? "active-tab" : ""}
          onClick={() => setActiveTab("patient")}
        >
          Patients
        </button>

        <button
          className={activeTab === "doctor" ? "active-tab" : ""}
          onClick={() => setActiveTab("doctor")}
        >
          Doctors
        </button>

        <button
          className={activeTab === "pharmacy" ? "active-tab" : ""}
          onClick={() => setActiveTab("pharmacy")}
        >
          Pharmacies
        </button>

        <button
          className={activeTab === "lab" ? "active-tab" : ""}
          onClick={() => setActiveTab("lab")}
        >
          Labs
        </button>
      </div>

      <div className="table">
        {loading && (
          <div className="table-loader">
            <div className="table-spinner"></div>
            <p>Loading users...</p>
          </div>
        )}
        <div className="table-header">
          <span>User ID</span>
          <span>Sub ID</span>
          <span>Name</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {users.map(user => (
          <div key={user.subId} className="table-row">
            <span>{user.userId}</span>
            <span>{user.subId}</span>
            <span>{user.name}</span>
            <StatusBadge status={user.status} />
            <button onClick={() => fetchDetails(user.userId)}>
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* ✅ Modal Properly Inside Return */}
      {details && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close" onClick={() => setDetails(null)}>
              ✕
            </button>

            <h2>User Details</h2>

            <div className="modal-grid">
  {[
    "name",
    "user_id",
    "patient_id",
    "doctor_id",
    "lab_id",
    "pharmacy_id",
    "nic",
    "address",
    "contact_no1",
    "contact_no2",
    "date_of_birth",
    "gender",
    "image_url",
    "qr_code",
    "created_at",
    "license_no",
    "specialization",
    "pharmacy_license_no",
    "business_registration_number",
    "business_registration_url",
    "available_tests"
  ].map((key) => {
    const value = details[key];
    if (!value) return null;

    // Custom label mapping
    const labelMap = {
      name: "Name",
      user_id: "User ID",
      patient_id: "Patient ID",
      doctor_id: "Doctor ID",
      lab_id: "Lab ID",
      pharmacy_id: "Pharmacy ID",
      nic: "NIC",
      address: "Address",
      contact_no1: "Primary Contact Number",
      contact_no2: "Secondary Contact Number",
      date_of_birth: "Date Of Birth",
      gender: "Gender",
      image_url: "Profile Image",
      qr_code: "QR Code",
      created_at: "Created At",
      license_no: "License Number",
      specialization: "Specialization",
      pharmacy_license_no: "License Number",
      business_registration_number: "Business Registration Number",
      business_registration_url: "Business Registration URL",
      available_tests: "Avialable Tests"

    };

    const formattedKey =
      labelMap[key] || key.replace(/_/g, " ");

    const isURL =
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"));

    return (
      <p key={key}>
        <strong>{formattedKey}:</strong>{" "}
        {isURL ? (
          <a href={value} target="_blank" rel="noopener noreferrer">
            View File
          </a>
        ) : (
          String(value)
        )}
      </p>
    );
  })}
</div>
  <div className="modal-actions">
  <button
    className="delete-btn"
    onClick={() => setShowDeleteConfirm(true)}
  >
    Delete User
  </button>
</div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
  <div className="modal-overlay">
    <div className="modal confirm-modal">
      <h3>
        Do you want to delete the {details.user_id} user?
      </h3>

      <div className="modal-actions">
        <button className="confirm-delete"
          onClick={() => deleteUser(details.user_id)}
        >
          Confirm
        </button>

        <button
          className="cancel-delete"
          onClick={() => setShowDeleteConfirm(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  
);
}

function Loader() {
  return (
    <div className="loader-overlay">
      <div className="spinner"></div>
      <p className="loading-text">Loading...</p>
    </div>
  );
}

/* ================= MAIN APP ================= */

function App() {
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const changePage = (newPage) => {
    setLoading(true);

    // simulate loading delay while data loads
    setTimeout(() => {
      setPage(newPage);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="app">
      {loading && <Loader />}

      <Sidebar setPage={changePage} page={page} />

      <div className="main">
        <Topbar />

        {page === "dashboard" && <Dashboard />}
        {page === "requests" && <RegistrationRequests />}
        {page === "users" && <ManageUsers />}
      </div>
    </div>
  );
}

export default App;