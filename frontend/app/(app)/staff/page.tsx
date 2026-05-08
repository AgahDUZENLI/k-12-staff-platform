"use client";
import { useEffect, useState } from "react";
import { getStaff, Teacher } from "@/lib/api";
import Link from "next/link";

const SUBJECT_FILTERS = [
  "All",
  "English",
  "Math",
  "History",
  "AP",
  "PreAP",
];

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => { getStaff().then(r => setStaff(r.data)); }, []);

  const filtered = staff.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.subjects?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "All" || t.subjects?.some((s: string) =>
      s.toLowerCase().includes(filter.toLowerCase())
    );
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="fade-up-1" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          Westridge Academy
        </div>
        <h1 style={{ fontSize: 36, color: "var(--navy)" }}>Staff Directory</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{staff.length} teachers</p>
      </div>

      {/* Search + filters */}
      <div className="fade-up-2" style={{ marginBottom: 24 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or subject..."
          style={{
            width: "100%", padding: "11px 16px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: 13, outline: "none",
            color: "var(--text)", marginBottom: 12,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {SUBJECT_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "5px 14px", fontSize: 12,
              background: filter === f ? "var(--navy)" : "var(--surface)",
              color: filter === f ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--border)",
              cursor: "pointer", transition: "all 0.15s",
              fontFamily: "'DM Sans', sans-serif",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Staff list */}
      <div className="fade-up-3" style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
        {filtered.length === 0 && (
          <div style={{ background: "var(--surface)", padding: "24px", color: "var(--text-muted)", fontSize: 13 }}>
            No staff match your search.
          </div>
        )}
        {filtered.map((t) => (
          <Link key={t.id} href={`/staff/${t.id}`} style={{
            display: "flex", alignItems: "center",
            padding: "18px 24px",
            background: "var(--surface)",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
          >
            {/* Avatar */}
            <div style={{
              width: 40, height: 40,
              background: "var(--navy)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 600,
              marginRight: 16, flexShrink: 0,
              fontFamily: "'DM Serif Display', serif",
            }}>
              {t.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: t.subjects?.length ? 8 : 0 }}>{t.email}</div>
              {t.subjects?.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {t.subjects.map((s: string) => (
                    <span key={s} style={{
                      fontSize: 10, padding: "2px 8px",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-mid)",
                      letterSpacing: "0.02em",
                    }}>{s}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, marginLeft: 16 }}>View Profile →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}