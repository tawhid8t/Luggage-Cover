export default function AdminLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6fb",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #e8ecf5",
            borderTopColor: "#4A90E2",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Loading admin panel…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
