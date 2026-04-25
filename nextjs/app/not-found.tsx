import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <section
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🔍</div>
      <h1
        style={{
          fontFamily: "var(--font-heading), system-ui",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 900,
          marginBottom: "0.75rem",
          color: "var(--text-primary, #1a1f3a)",
        }}
      >
        Page Not Found
      </h1>
      <p
        style={{
          color: "var(--text-muted, #6b7280)",
          fontSize: "1.1rem",
          marginBottom: "2rem",
          maxWidth: 480,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/">
          <button
            style={{
              padding: "0.75rem 1.75rem",
              background: "linear-gradient(135deg, #4A90E2, #7B68EE)",
              color: "white",
              border: "none",
              borderRadius: "9999px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95rem",
              transition: "all 0.2s",
            }}
          >
            Back to Home
          </button>
        </Link>
        <Link href="/shop">
          <button
            style={{
              padding: "0.75rem 1.75rem",
              background: "white",
              color: "#1a1f3a",
              border: "2px solid #e8ecf5",
              borderRadius: "9999px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Browse Shop
          </button>
        </Link>
      </div>
    </section>
  );
}
