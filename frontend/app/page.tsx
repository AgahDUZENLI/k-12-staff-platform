"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => router.push("/welcome"), 600);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--navy)",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "var(--amber)" }} />
      <div className="fade-up" style={{ width: 360, position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, border: "1px solid rgba(255,255,255,0.15)", marginBottom: 20 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" fill="var(--amber)" />
              <rect x="13" y="3" width="8" height="8" fill="rgba(255,255,255,0.3)" />
              <rect x="3" y="13" width="8" height="8" fill="rgba(255,255,255,0.3)" />
              <rect x="13" y="13" width="8" height="8" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#fff", letterSpacing: "-0.5px" }}>DAKAS</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginTop: 4, textTransform: "uppercase" }}>Dynamic Active K–12 Administration</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email address" defaultValue="mitchell@westridge.edu" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none", width: "100%", fontFamily: "'DM Sans',sans-serif" }} />
          <input type="password" placeholder="Password" defaultValue="••••••••" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none", width: "100%", fontFamily: "'DM Sans',sans-serif" }} />
          <button onClick={handleLogin} disabled={loading} style={{ background: loading ? "rgba(232,160,32,0.7)" : "var(--amber)", color: "var(--navy)", border: "none", padding: "13px 16px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Prototype — any credentials accepted</div>
      </div>
    </div>
  );
}