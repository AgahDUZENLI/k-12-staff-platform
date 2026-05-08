"use client";
import { useEffect, useState } from "react";
import { getStaff, Teacher } from "@/lib/api";
import Link from "next/link";

export default function StaffPage() {
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { getStaff().then(r => setStaff(r.data)); }, []);

  const filtered = staff.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="fade-up-1" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          Westridge Academy
        </div>
        <h1 style={{ fontSize: 36, color: "var(--navy)" }}>Staff Directory</h1>
      </div>

      <div className="fade-up-2" style={{ marginBottom: 24 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          style={{
            width: "100%", padding: "11px 16px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: 14, outline: "none",
            color: "var(--text)",
          }}
        />
      </div>

      <div className="fade-up-3" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
        {filtered.map((t, i) => (
          <Link key={t.id} href={`/staff/${t.id}`} style={{
            display: "flex", alignItems: "center",
            padding: "18px 24px",
            borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
          >
            <div style={{
              width: 36, height: 36,
              background: "var(--navy)",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 600,
              marginRight: 16, flexShrink: 0,
            }}>
              {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{t.email}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>View Profile →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}