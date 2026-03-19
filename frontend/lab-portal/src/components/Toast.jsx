export default function ToastHost({ toasts, remove }) {
  return (
    <div className="fixed right-5 top-5 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-soft border text-sm min-w-[280px] ${
            t.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : t.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-gray-50 border-gray-200 text-gray-800"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>{t.message}</div>
            <button onClick={() => remove(t.id)} className="text-xs opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}