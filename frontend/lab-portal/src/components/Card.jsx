export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-soft border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}