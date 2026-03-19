export default function Badge({ text }) {
  const t = (text || "").toLowerCase();
  const cls =
    t === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : t === "accepted"
      ? "bg-blue-100 text-blue-800"
      : t === "rejected"
      ? "bg-red-100 text-red-800"
      : t === "in_progress"
      ? "bg-purple-100 text-purple-800"
      : t === "completed"
      ? "bg-green-100 text-green-800"
      : t === "sent"
      ? "bg-teal-100 text-teal-800"
      : "bg-gray-100 text-gray-700";

  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>{text}</span>;
}