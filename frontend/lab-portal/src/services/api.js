import axios from "axios";
import { auth } from "../firebase/firebase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 30000
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function isGateError(err) {
  const msg = err?.response?.data?.error || "";
  return (
    err?.response?.status === 403 &&
    (msg.includes("Waiting for admin approval") ||
      msg.includes("Lab staff not registered") ||
      msg.includes("Not a LAB account"))
  );
}