"use client";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
    }}>
      <div className="fade-up" style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
          Welcome back
        </div>
        <h1 style={{ fontSize: 42, color: "var(--navy)", lineHeight: 1.15, marginBottom: 8 }}>
          Dr. Sarah Mitchell
        </h1>
        <div style={{
          display: "inline-block",
          background: "var(--navy)",
          color: "#fff",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "4px 12px",
          marginBottom: 32,
        }}>
          Principal — Westridge Academy
        </div>
        <p style={{ color: "var(--text-mid)", fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
          You have <strong>3 pending reviews</strong> and <strong>3 open goals</strong> awaiting attention. David Kim has been flagged in recent observations.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "var(--navy)",
            color: "#fff",
            border: "none",
            padding: "14px 40px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          Enter Dashboard →
        </button>
      </div>
    </div>
  );
}