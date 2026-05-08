"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/staff",     label: "Staff" },
  { href: "/observations/new", label: "Observe" },
  { href: "/reviews/new",      label: "Review" },
  { href: "/goals",    label: "Goals" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{
      position: "fixed", top: 0, left: 0,
      width: 220, height: "100vh",
      background: "var(--navy)",
      display: "flex", flexDirection: "column",
      padding: "32px 0",
      zIndex: 100,
      borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Amber top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--amber)" }} />

      {/* Logo */}
      <div style={{ padding: "0 28px", marginBottom: 40 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", letterSpacing: "-0.3px" }}>
          DAKAS
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
          Westridge Academy
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, padding: "0 12px" }}>
          Navigation
        </div>
        {links.map((l) => {
          const active = path === l.href || (l.href !== "/dashboard" && path.startsWith(l.href));
          return (
            <Link key={l.href} href={l.href} style={{
              display: "block",
              padding: "9px 12px",
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              color: active ? "#fff" : "rgba(255,255,255,0.45)",
              background: active ? "rgba(255,255,255,0.08)" : "transparent",
              borderLeft: active ? "2px solid var(--amber)" : "2px solid transparent",
              textDecoration: "none",
              transition: "all 0.15s",
              letterSpacing: "0.01em",
            }}>
              {l.label}
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div style={{ marginTop: "auto", padding: "0 28px" }}>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>Dr. Sarah Mitchell</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Principal</div>
        </div>
      </div>
    </aside>
  );
}