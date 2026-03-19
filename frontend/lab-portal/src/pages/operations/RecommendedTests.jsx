import { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import Loading from "../../components/Loading.jsx";
import Table from "../../components/Table.jsx";
import { api } from "../../services/api";
import { useLabGate } from "../../hooks/useLabGate";

export default function RecommendedTests() {
  const { gate, message } = useLabGate();
  const [data, setData] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (gate !== "active") return;
    let mounted = true;

    async function load() {
      setBusy(true);
      try {
        const res = await api.get("/api/lab/recommended-tests");
        if (!mounted) return;
        setData(res.data || []);
      } finally {
        if (mounted) setBusy(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [gate]);

  if (gate === "checking") return <Loading label="Checking access..." />;

  if (gate !== "active") {
    return (
      <Card className="p-6">
        <div className="font-semibold">Recommended Tests</div>
        <div className="mt-2 text-sm text-gray-600">
          Locked: {message || "Waiting for admin approval."}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="font-semibold text-gray-900 mb-4">Recommended Tests</div>

      {busy ? (
        <Loading />
      ) : (
        <Table
          columns={[
            { key: "test_name", label: "TEST NAME" },
            { key: "count", label: "COUNT" }
          ]}
          rows={data}
          emptyText="No recommendations yet"
        />
      )}
    </Card>
  );
}