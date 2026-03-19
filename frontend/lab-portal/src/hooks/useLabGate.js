import { useEffect, useState } from "react";
import { api } from "../services/api";

export function useLabGate() {
  const [gate, setGate] = useState("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const res = await api.get("/api/lab/me");
        if (!mounted) return;

        const status = res.data?.status;
        if (status === "approved" || status === "active") {
          setGate("active");
        } else if (status === "pending") {
          setGate("pending");
          setMessage("Your lab account is pending admin approval.");
        } else {
          setGate("pending");
          setMessage(res.data?.message || "Waiting for admin approval.");
        }
      } catch (err) {
        if (!mounted) return;
        const errMsg = err?.response?.data?.error || err.message;

        if (err?.response?.status === 403) {
          setGate("pending");
          setMessage(errMsg || "Waiting for admin approval.");
        } else {
          setGate("error");
          setMessage(errMsg || "Failed to check lab access.");
        }
      }
    }

    checkAccess();
    return () => { mounted = false; };
  }, []);

  return { gate, message };
}
