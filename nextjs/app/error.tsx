"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            background: "#f4f6fb",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: "0.5rem",
              color: "#1a1f3a",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "1.5rem",
              textAlign: "center",
              maxWidth: 400,
            }}
          >
            {error?.message || "An unexpected error occurred. Please try again."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.625rem 1.25rem",
                background: "linear-gradient(135deg, #4A90E2, #7B68EE)",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try Again
            </button>
            <Link href="/">
              <button
                style={{
                  padding: "0.625rem 1.25rem",
                  background: "white",
                  color: "#1a1f3a",
                  border: "1px solid #e8ecf5",
                  borderRadius: "0.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
