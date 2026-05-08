"use client";
import { useEffect, useState } from "react";
import { getDashboard, DashboardData } from "@/lib/api";
import Link from "next/link";

const FRAMEWORK_LABEL: Record<string, string> = {
  "5e": "5E", gradual_release: "Gradual Release",
  direct_instruction: "Direct Instruction", collaborative: "Collaborative", general: "General",
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// teacherId maps to seed data UUIDs
const TEACHER_IDS: Record<string, string> = {
  carter: "00000000-0000-0000-0000-000000000011",
  lopez:  "00000000-0000-0000-0000-000000000012",
  kim:    "00000000-0000-0000-0000-000000000013",
  nair:   "00000000-0000-0000-0000-000000000014",
  reed:   "00000000-0000-0000-0000-000000000015",
};

const EVENTS: Record<number, { label: string; type: "observation"|"review"|"goal"; teacherKey?: string }[]> = {
  5:  [{ label: "Carter co-teach obs",   type: "observation", teacherKey: "carter" }],
  6:  [{ label: "Kim observation",        type: "observation", teacherKey: "kim" }],
  8:  [{ label: "Nair review due",        type: "review",      teacherKey: "nair" }],
  12: [{ label: "School-wide PD",         type: "goal" }],
  15: [{ label: "Kim review due",         type: "review",      teacherKey: "kim" }],
  20: [{ label: "Reed check-in",          type: "goal",        teacherKey: "reed" }],
  22: [{ label: "Lopez review due",       type: "review",      teacherKey: "lopez" }],
  28: [{ label: "Kim goal deadline",      type: "goal",        teacherKey: "kim" }],
  31: [{ label: "End of cycle",           type: "review" }],
};

const COLOR = { observation: "#1A56DB", review: "#E8A020", goal: "#2D7A4F" };

function eventHref(e: { type: string; teacherKey?: string }) {
  if (!e.teacherKey) return null;
  const tid = TEACHER_IDS[e.teacherKey];
  if (e.type === "review") return `/reviews/new?teacher=${tid}`;
  if (e.type === "observation") return `/observations/new?teacher=${tid}`;
  if (e.type === "goal") return `/staff/${tid}`;
  return null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(8);

  useEffect(() => { getDashboard().then(r => setData(r.data)); }, []);

  const year = 2026, month = 4, today = 8;
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: 31 }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedEvents = selectedDay && EVENTS[selectedDay] ? EVENTS[selectedDay] : [];

  if (!data) return <div style={{ color: "var(--text-muted)", paddingTop: 40 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="fade-up-1" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          Westridge Academy — May 2026
        </div>
        <h1 style={{ fontSize: 36, color: "var(--navy)" }}>Dashboard</h1>
      </div>

      {/* KPIs */}
      <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "var(--border)", marginBottom: 40 }}>
        {[
          { label: "Observations This Month", value: data.observations_this_month },
          { label: "Pending Reviews", value: data.pending_reviews, warn: data.pending_reviews > 0 },
          { label: "Open Goals", value: data.open_goals },
          { label: "At Risk Goals", value: data.at_risk_goals, warn: data.at_risk_goals > 0 },
        ].map(({ label, value, warn }) => (
          <div key={label} style={{ background: "var(--surface)", padding: "24px 20px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 38, fontFamily: "'DM Serif Display',serif", color: warn ? "var(--amber)" : "var(--navy)", lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.55fr 1fr", gap: 24 }}>

        {/* Calendar */}
        <div className="fade-up-3">
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>May 2026</div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 8 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {cells.map((day, i) => {
                const events = day && EVENTS[day] ? EVENTS[day] : [];
                const isToday = day === today;
                const isSelected = day === selectedDay;
                return (
                  <div key={i} onClick={() => day && setSelectedDay(day === selectedDay ? null : day)} style={{
                    minHeight: 44, padding: "5px 3px",
                    background: isSelected ? "var(--navy)" : isToday ? "#EBF2FF" : "var(--bg)",
                    cursor: day ? "pointer" : "default",
                    transition: "background 0.15s",
                  }}>
                    {day && (
                      <>
                        <div style={{ fontSize: 11, textAlign: "center", marginBottom: 4, color: isSelected ? "#fff" : isToday ? "var(--blue)" : "var(--text-mid)", fontWeight: isToday || isSelected ? 600 : 400 }}>{day}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {events.slice(0, 2).map((e, j) => (
                            <div key={j} style={{ height: 3, borderRadius: 2, background: COLOR[e.type] }} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
              {(["observation","review","goal"] as const).map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR[t] }} />
                  <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize" }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Selected day detail */}
            {selectedDay && (
              <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  May {selectedDay}
                </div>
                {selectedEvents.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No events scheduled.</div>
                ) : selectedEvents.map((e, i) => {
                  const href = eventHref(e);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLOR[e.type], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--navy)", flex: 1 }}>{e.label}</span>
                      {href && (
                        <Link href={href} style={{
                          fontSize: 11, color: "#fff",
                          background: e.type === "review" ? "var(--amber)" : e.type === "observation" ? "var(--blue)" : "var(--green)",
                          padding: "3px 10px", textDecoration: "none", flexShrink: 0,
                        }}>
                          {e.type === "review" ? "Start Review →" : e.type === "observation" ? "Observe →" : "View →"}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming — clickable, reviews link to review form */}
        <div className="fade-up-4">
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Upcoming</div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {Object.entries(EVENTS).sort((a,b) => +a[0] - +b[0]).map(([day, evs]) =>
              evs.map((e, idx) => {
                const href = eventHref(e);
                return (
                  <div key={`${day}-${idx}`} style={{ borderBottom: "1px solid var(--border)" }}>
                    {href ? (
                      <Link href={href} style={{
                        padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start",
                        textDecoration: "none",
                        background: selectedDay === +day ? "var(--bg)" : "var(--surface)",
                        transition: "background 0.15s",
                      }}
                      onClick={() => setSelectedDay(+day)}
                      >
                        <div style={{ width: 3, height: 3, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: COLOR[e.type] }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "var(--navy)", fontWeight: 500, lineHeight: 1.4 }}>{e.label}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>May {day}</div>
                        </div>
                        <span style={{ fontSize: 10, color: COLOR[e.type], flexShrink: 0, marginTop: 2 }}>→</span>
                      </Link>
                    ) : (
                      <div onClick={() => setSelectedDay(+day)} style={{
                        padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start",
                        cursor: "pointer",
                        background: selectedDay === +day ? "var(--bg)" : "var(--surface)",
                      }}>
                        <div style={{ width: 3, height: 3, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: COLOR[e.type] }} />
                        <div>
                          <div style={{ fontSize: 12, color: "var(--navy)", fontWeight: 500, lineHeight: 1.4 }}>{e.label}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>May {day}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Flagged + Recent */}
        <div className="fade-up-5" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Flagged Staff</div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {data.flagged_staff.length === 0 ? (
                <div style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: 12 }}>None in last 60 days.</div>
              ) : data.flagged_staff.map((s, i) => (
                <Link key={s.id} href={`/staff/${s.id}`} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "14px 20px",
                  borderBottom: i < data.flagged_staff.length - 1 ? "1px solid var(--border)" : "none",
                  textDecoration: "none",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{s.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--amber)" }}>Review →</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Recent Observations</div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {data.recent_observations.map((o, i) => {
                const vals = Object.values(o.scores) as number[];
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                return (
                  <div key={o.id} style={{
                    padding: "12px 20px",
                    borderBottom: i < data.recent_observations.length - 1 ? "1px solid var(--border)" : "none",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.teacher_name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{o.observed_at} · {FRAMEWORK_LABEL[o.framework] || o.framework}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, flexShrink: 0, color: avg >= 3.5 ? "var(--green)" : avg <= 2 ? "var(--red)" : "var(--navy)" }}>
                      {avg.toFixed(1)}
                    </div>
                    {o.flagged && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--amber)", flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}