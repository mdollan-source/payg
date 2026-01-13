"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <h1
              style={{
                fontSize: "3.75rem",
                fontWeight: "bold",
                color: "#111827",
                marginBottom: "1rem",
              }}
            >
              500
            </h1>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "1rem",
              }}
            >
              Something Went Wrong
            </h2>
            <p
              style={{
                color: "#6b7280",
                marginBottom: "2rem",
                maxWidth: "28rem",
              }}
            >
              We apologize for the inconvenience. A critical error occurred.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "1rem",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: "500",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
