"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#f4f6fb",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
      <h2 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.5rem", color: "#1a1f3a" }}>
        Something went wrong
      </h2>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.9rem", maxWidth: 400, textAlign: "center" }}>
        {error?.message || "An unexpected error occurred."}
      </p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            background: "linear-gradient(135deg, #4A90E2, #7B68EE)",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Try Again
        </button>
        <a href="/admin">
          <button
            style={{
              padding: "0.5rem 1rem",
              background: "white",
              color: "#1a1f3a",
              border: "1px solid #e8ecf5",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Back to Admin
          </button>
        </a>
      </div>
    </div>
  );
}
