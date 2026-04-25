export default function Loading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #e8ecf5",
          borderTopColor: "#4A90E2",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Loading…</p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
