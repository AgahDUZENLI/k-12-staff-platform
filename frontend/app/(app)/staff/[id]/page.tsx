"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getStaffById, getStaffSummary, updateGoal } from "@/lib/api";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  not_started: "#9AA0A6", in_progress: "#1A56DB", at_risk: "#E8A020",
  achieved: "#2D7A4F", not_met: "#C0392B",
  draft: "#9AA0A6", in_progress_rev: "#1A56DB", pending_signoff: "#E8A020", complete: "#2D7A4F",
};

const TAG_STYLE: Record<string, {bg: string, color: string}> = {
  commendation: { bg: "#EBF7F0", color: "#2D7A4F" },
  concern:      { bg: "#FDF0EE", color: "#C0392B" },
  coaching:     { bg: "#EBF2FF", color: "#1A56DB" },
  pd:           { bg: "#FFF8EC", color: "#E8A020" },
  general:      { bg: "#F5F5F5", color: "#4A5568" },
};

const FRAMEWORK_LABEL: Record<string, string> = {
  "5e": "5E Model", gradual_release: "Gradual Release",
  direct_instruction: "Direct Instruction", collaborative: "Collaborative", general: "General",
};

export default function StaffProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("observations");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    getStaffById(id as string).then(r => setData(r.data));
  }, [id]);

  const handleSummary = async () => {
    setSummaryLoading(true);
    try {
      const r = await getStaffSummary(id as string);
      setSummary(r.data.summary);
    } catch (e) {
      setSummary("Unable to generate summary. Please check your AI configuration.");
    }
    setSummaryLoading(false);
  };

  if (!data) return <div style={{ color: "var(--text-muted)", paddingTop: 40 }}>Loading...</div>;

  const { teacher, observations, reviews, notes, goals } = data;
  const tabs = ["observations", "reviews", "notes", "goals"];

  const avgScore = observations.length > 0
    ? (observations.flatMap((o: any) => Object.values(o.scores) as number[])
        .reduce((a: number, b: number) => a + b, 0) /
        (observations.flatMap((o: any) => Object.values(o.scores)).length)).toFixed(1)
    : "—";

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div className="fade-up-1" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <Link href="/staff" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>← Staff</Link>
          <h1 style={{ fontSize: 36, color: "var(--navy)", marginTop: 8 }}>{teacher.name}</h1>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{teacher.email}</div>
        </div>
        <button
          onClick={handleSummary}
          disabled={summaryLoading}
          style={{
            background: summaryLoading ? "rgba(13,27,42,0.5)" : "var(--navy)",
            color: "#fff", border: "none",
            padding: "11px 20px", fontSize: 13,
            cursor: summaryLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span style={{ color: "var(--amber)" }}>✦</span>
          {summaryLoading ? "Generating..." : "AI Staff Summary"}
        </button>
      </div>

      {/* Quick stats */}
      <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "var(--border)", marginBottom: 32 }}>
        {[
          { label: "Observations", value: observations.length },
          { label: "Avg Domain Score", value: `${avgScore}/4` },
          { label: "Active Goals", value: goals.filter((g: any) => ["not_started","in_progress","at_risk"].includes(g.status)).length },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--surface)", padding: "20px 24px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontFamily: "'DM Serif Display',serif", color: "var(--navy)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="fade-up" style={{
          borderLeft: "3px solid var(--amber)",
          background: "var(--surface)",
          padding: "20px 24px",
          marginBottom: 32,
        }}>
          <div style={{ fontSize: 10, color: "var(--amber)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
            ✦ AI Generated Summary
          </div>
          <p style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.75 }}>{summary}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="fade-up-3" style={{ borderBottom: "1px solid var(--border)", marginBottom: 28, display: "flex", gap: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: tab === t ? 500 : 400,
            color: tab === t ? "var(--navy)" : "var(--text-muted)",
            background: "none", border: "none",
            borderBottom: tab === t ? "2px solid var(--navy)" : "2px solid transparent",
            cursor: "pointer",
            textTransform: "capitalize",
            letterSpacing: "0.01em",
            marginBottom: -1,
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Observations Tab */}
      {tab === "observations" && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
          {observations.length === 0 && <div style={{ background: "var(--surface)", padding: "24px", color: "var(--text-muted)" }}>No observations yet.</div>}
          {observations.map((o: any) => {
            const avg = (Object.values(o.scores) as number[]).reduce((a, b) => a + b, 0) / Object.values(o.scores).length;
            return (
              <div key={o.id} style={{ background: "var(--surface)", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{o.observed_at}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 12 }}>
                      {FRAMEWORK_LABEL[o.framework] || o.framework} · {o.observation_type}
                    </span>
                    {o.course_name && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>· {o.course_name}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: avg >= 3.5 ? "var(--green)" : avg <= 2 ? "var(--red)" : "var(--navy)" }}>
                      {avg.toFixed(1)}/4
                    </span>
                    {o.flagged && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)" }} />}
                  </div>
                </div>
                {/* Scores */}
                <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                  {Object.entries(o.scores).map(([k, v]: any) => (
                    <div key={k} style={{ textAlign: "center" }}>
                      <div style={{
                        fontSize: 18, fontFamily: "'DM Serif Display',serif",
                        color: v >= 4 ? "var(--green)" : v <= 2 ? "var(--red)" : "var(--navy)"
                      }}>{v}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize", letterSpacing: "0.05em", marginTop: 2 }}>
                        {k.replace(/_/g, " ")}
                      </div>
                    </div>
                  ))}
                </div>
                {o.ai_summary && (
                  <div style={{ borderLeft: "2px solid var(--amber)", paddingLeft: 14 }}>
                    <div style={{ fontSize: 10, color: "var(--amber)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>✦ AI Summary</div>
                    <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.65 }}>{o.ai_summary}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === "reviews" && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
          {reviews.length === 0 && <div style={{ background: "var(--surface)", padding: "24px", color: "var(--text-muted)" }}>No reviews yet.</div>}
          {reviews.map((r: any) => (
            <div key={r.id} style={{ background: "var(--surface)", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", fontFamily: "'DM Serif Display',serif" }}>{r.period}</span>
                <span style={{
                  fontSize: 11, padding: "3px 10px",
                  background: "rgba(0,0,0,0.04)",
                  color: STATUS_COLOR[r.status] || "var(--text-muted)",
                  textTransform: "capitalize", letterSpacing: "0.05em",
                }}>
                  {r.status.replace(/_/g, " ")}
                </span>
              </div>
              <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
                {Object.entries(r.category_scores).map(([k, v]: any) => (
                  <div key={k} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontFamily: "'DM Serif Display',serif", color: v >= 4 ? "var(--green)" : v <= 2 ? "var(--red)" : "var(--navy)" }}>{v}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize", letterSpacing: "0.05em", marginTop: 2 }}>
                      {k.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
              </div>
              {r.final_notes && <p style={{ fontSize: 13, color: "var(--text-mid)", marginBottom: 16, lineHeight: 1.65 }}>{r.final_notes}</p>}
              {r.ai_summary && (
                <div style={{ borderLeft: "2px solid var(--amber)", paddingLeft: 14 }}>
                  <div style={{ fontSize: 10, color: "var(--amber)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>✦ AI Summary</div>
                  <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.65 }}>{r.ai_summary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notes Tab */}
      {tab === "notes" && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
          {notes.length === 0 && <div style={{ background: "var(--surface)", padding: "24px", color: "var(--text-muted)" }}>No notes yet.</div>}
          {notes.map((n: any) => {
            const ts = TAG_STYLE[n.tag] || TAG_STYLE.general;
            return (
              <div key={n.id} style={{ background: "var(--surface)", padding: "20px 24px", display: "flex", gap: 16 }}>
                {n.pinned && <div style={{ color: "var(--amber)", fontSize: 14, flexShrink: 0, marginTop: 2 }}>◆</div>}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", background: ts.bg, color: ts.color, textTransform: "capitalize" }}>
                      {n.tag}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.65 }}>{n.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goals Tab */}
      {tab === "goals" && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
          {goals.length === 0 && <div style={{ background: "var(--surface)", padding: "24px", color: "var(--text-muted)" }}>No goals yet.</div>}
          {goals.map((g: any) => (
            <div key={g.id} style={{ background: "var(--surface)", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--navy)" }}>{g.title}</div>
                <span style={{ fontSize: 11, color: STATUS_COLOR[g.status] || "var(--text-muted)", textTransform: "capitalize", flexShrink: 0, marginLeft: 16 }}>
                  ● {g.status.replace(/_/g, " ")}
                </span>
              </div>
              {g.linked_dimension && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "capitalize" }}>
                  {g.linked_dimension.replace(/_/g, " ")} · {g.evidence_type?.replace(/_/g, " ")}
                </div>
              )}
              {g.description && <p style={{ fontSize: 13, color: "var(--text-mid)", marginBottom: 12, lineHeight: 1.65 }}>{g.description}</p>}
              {g.target_date && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>Due {g.target_date}</div>}

              {/* Milestones */}
              {g.milestones?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {g.milestones.map((m: any) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ width: 14, height: 14, border: "1px solid var(--border-strong)", background: m.completed ? "var(--green)" : "transparent", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: m.completed ? "var(--text-muted)" : "var(--text-mid)", textDecoration: m.completed ? "line-through" : "none" }}>
                        {m.description}
                      </span>
                      {m.due_date && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{m.due_date}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Updates */}
              {g.updates?.length > 0 && (
                <div style={{ paddingLeft: 12, borderLeft: "1px solid var(--border)" }}>
                  {g.updates.map((u: any) => (
                    <div key={u.id} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{u.author_name || "Admin"}</div>
                      <p style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.5 }}>{u.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}