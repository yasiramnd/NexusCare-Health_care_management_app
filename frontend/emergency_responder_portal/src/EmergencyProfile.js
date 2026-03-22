// Fetches emergency profile using patient ID from URL
// Displays backend messages properly

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loader from "./Loader";


function EmergencyProfile() {

  const { patientId } = useParams();

  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const apiBase = process.env.REACT_APP_API_BASE_URL;
    fetch(`${apiBase}/emergency/${patientId}`);

}, [patientId]);

  // Show loading animation
  if (loading) return <Loader />;

  // Handle specific backend messages
  if (message === "Profile not public visible")
    return <div className="message">Profile is not visible</div>;

  if (message === "No record found")
    return <div className="message">No record found</div>;

  if (message)
    return <div className="message">{message}</div>;

  // Display emergency profile
  return (
    <div className="container">
      <h1 className="title">🚑 Emergency Medical Profile</h1>

      <div className="card">
        <p><strong>Name:</strong> {data.name}</p>
        <p><strong>Address:</strong> {data.address}</p>
        <p><strong>Gender:</strong> {data.gender}</p>
        <p><strong>Emergency Contact:</strong> {data.contact_name}</p>
        <p><strong>Contact Phone:</strong> {data.contact_phone}</p>
        <p><strong>Chronic Conditions:</strong> {data.chronic_conditions}</p>
        <p><strong>Blood Group:</strong> {data.blood_group}</p>
        <p><strong>Allergies:</strong> {data.allergies}</p>
      </div>
    </div>
  );
}

export default EmergencyProfile;