"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getStaffById, getStaffSummary, updateGoal, createNote } from "@/lib/api";
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

const SECTION_LABELS: Record<string, string> = {
  lesson_overview: "Lesson Overview",
  lesson_structure: "Lesson Structure",
  student_participation: "Student Participation",
  questioning_strategies: "Questioning Strategies",
  classroom_management: "Classroom Management",
  time_management: "Time Management",
  technology_integration: "Technology Integration",
  special_needs: "Special Needs Accommodations",
  student_interaction: "Student Interaction",
  problem_solving: "Problem Solving Structure",
};

function ObservationCard({ o, avg, hasSectionNotes }: { o: any; avg: number; hasSectionNotes: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "var(--surface)", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{o.observed_at}</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 12 }}>
            {FRAMEWORK_LABEL[o.framework] || o.framework} · {o.observation_type}
          </span>
          {o.course_name && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>· {o.course_name}</span>}
          {o.room && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>· Room {o.room}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: avg >= 3.5 ? "var(--green)" : avg <= 2 ? "var(--red)" : "var(--navy)" }}>
            {avg.toFixed(1)}/4
          </span>
          {o.flagged && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)" }} />}
        </div>
      </div>

      {/* Domain scores */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(o.scores).map(([k, v]: any) => (
          <div key={k} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontFamily: "'DM Serif Display',serif", color: v >= 4 ? "var(--green)" : v <= 2 ? "var(--red)" : "var(--navy)" }}>{v}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize", letterSpacing: "0.05em", marginTop: 2 }}>{k.replace(/_/g," ")}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {o.ai_summary && (
        <div style={{ borderLeft: "2px solid var(--amber)", paddingLeft: 14, marginBottom: hasSectionNotes ? 16 : 0 }}>
          <div style={{ fontSize: 10, color: "var(--amber)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>✦ AI Summary</div>
          <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.65 }}>{o.ai_summary}</p>
        </div>
      )}

      {/* Expand toggle */}
      {hasSectionNotes && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: "var(--text-muted)",
              padding: "6px 0", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span style={{ fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
            {expanded ? "Hide full notes" : "View full observation notes"}
          </button>

          {expanded && (
            <div style={{ marginTop: 20, borderTop: "2px solid var(--navy)", paddingTop: 24 }}>
              {/* Report header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: "var(--navy)", marginBottom: 4 }}>
                    Classroom Observation Report
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {o.observed_at} · {FRAMEWORK_LABEL[o.framework] || o.framework} · {o.observation_type.charAt(0).toUpperCase() + o.observation_type.slice(1)}
                    {o.course_name && ` · ${o.course_name}`}
                    {o.room && ` · Room ${o.room}`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Observer</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>Dr. Sarah Mitchell</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Principal, Westridge Academy</div>
                </div>
              </div>

              {/* Domain scores summary */}
              <div style={{ background: "var(--bg)", padding: "16px 20px", marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
                {Object.entries(o.scores).map(([k, v]: any) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'DM Serif Display',serif", fontSize: 16, fontWeight: 600,
                      background: v >= 4 ? "#EBF7F0" : v <= 2 ? "#FDF0EE" : "var(--surface)",
                      color: v >= 4 ? "var(--green)" : v <= 2 ? "var(--red)" : "var(--navy)",
                      border: `1px solid ${v >= 4 ? "#2D7A4F" : v <= 2 ? "#C0392B" : "var(--border)"}`,
                    }}>{v}</div>
                    <span style={{ fontSize: 11, color: "var(--text-mid)", textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>

              {/* Overall notes */}
              {o.raw_notes && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, fontWeight: 600 }}>
                    Overall Observation Notes
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.8, fontStyle: "italic" }}>{o.raw_notes}</p>
                </div>
              )}

              {/* Section notes as report sections */}
              {Object.entries(o.section_notes).filter(([, v]: any) => v).map(([k, v]: any, idx, arr) => (
                <div key={k} style={{
                  paddingBottom: 20,
                  marginBottom: 20,
                  borderBottom: idx < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: "var(--navy)",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <div style={{ width: 3, height: 14, background: "var(--navy)", flexShrink: 0 }} />
                    {SECTION_LABELS[k] || k.replace(/_/g, " ")}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.8 }}>{v}</p>
                </div>
              ))}

              {/* Report footer */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Status: <span style={{ textTransform: "capitalize", color: "var(--navy)" }}>{o.status}</span>
                  {o.flagged && <span style={{ marginLeft: 12, color: "var(--amber)", fontWeight: 500 }}>⚠ Flagged for follow-up</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Westridge Academy — Houston ISD</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function StaffProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("observations");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteTag, setNoteTag] = useState("general");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

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

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setNoteSubmitting(true);
    await createNote({
      teacher_id: id as string,
      author_id: "00000000-0000-0000-0000-000000000010",
      content: noteContent,
      tag: noteTag,
      pinned: false,
    });
    setNoteContent("");
    setNoteTag("general");
    const r = await getStaffById(id as string);
    setData(r.data);
    setNoteSubmitting(false);
  };

  if (!data) return <div style={{ color: "var(--text-muted)", paddingTop: 40 }}>Loading...</div>;

  const { teacher, observations, reviews, notes, goals } = data;
  const tabs = ["observations", "reviews", "notes", "goals", "schedule"];

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
          {teacher.subjects?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {teacher.subjects.map((s: string) => (
                <span key={s} style={{
                  fontSize: 11, padding: "3px 10px",
                  background: "var(--bg)", border: "1px solid var(--border)",
                  color: "var(--text-mid)",
                }}>{s}</span>
              ))}
            </div>
          )}
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
            const hasSectionNotes = o.section_notes && Object.values(o.section_notes).some((v: any) => v);
            return (
              <ObservationCard key={o.id} o={o} avg={avg} hasSectionNotes={hasSectionNotes} />
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
        <div className="fade-up">
          {/* Add note form */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px 24px", marginBottom: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Add Note</div>
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              rows={3}
              placeholder="Write a note about this staff member..."
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid var(--border)", background: "var(--bg)",
                fontSize: 13, color: "var(--text)", outline: "none",
                fontFamily: "'DM Sans',sans-serif", resize: "none",
                marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select
                value={noteTag}
                onChange={e => setNoteTag(e.target.value)}
                style={{
                  padding: "8px 12px", border: "1px solid var(--border)",
                  background: "var(--bg)", fontSize: 12, color: "var(--text)",
                  outline: "none", fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                }}
              >
                <option value="commendation">Commendation</option>
                <option value="concern">Concern</option>
                <option value="coaching">Coaching</option>
                <option value="pd">PD</option>
                <option value="general">General</option>
              </select>
              <button
                onClick={handleAddNote}
                disabled={noteSubmitting || !noteContent.trim()}
                style={{
                  background: noteSubmitting || !noteContent.trim() ? "rgba(13,27,42,0.4)" : "var(--navy)",
                  color: "#fff", border: "none",
                  padding: "8px 20px", fontSize: 13,
                  cursor: noteSubmitting || !noteContent.trim() ? "not-allowed" : "pointer",
                }}
              >
                {noteSubmitting ? "Saving..." : "Add Note"}
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
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

      {/* Schedule Tab */}
      {tab === "schedule" && (
        <div className="fade-up">
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 140px 1fr 80px 100px", background: "var(--navy)", padding: "10px 20px" }}>
              {["Period","Time","Course","Room","Days"].map(h => (
                <div key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{h}</div>
              ))}
            </div>
            {(!teacher.schedule || teacher.schedule.length === 0) && (
              <div style={{ padding: "24px 20px", color: "var(--text-muted)", fontSize: 13 }}>No schedule on file.</div>
            )}
            {teacher.schedule?.map((s: any, i: number) => {
              const isConf = s.course.toLowerCase().includes("conference");
              const isSpecial = s.course.toLowerCase().includes("mentor") || s.course.toLowerCase().includes("plc") || s.course.toLowerCase().includes("uil") || s.course.toLowerCase().includes("coach") || s.course.toLowerCase().includes("tutor");
              return (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "80px 140px 1fr 80px 100px",
                  padding: "14px 20px",
                  borderBottom: i < teacher.schedule.length - 1 ? "1px solid var(--border)" : "none",
                  background: i % 2 === 0 ? "var(--surface)" : "var(--bg)",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{s.period}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.time}</div>
                  <div style={{ fontSize: 13, color: isConf ? "var(--text-muted)" : isSpecial ? "var(--blue)" : "var(--text)", fontStyle: isConf ? "italic" : "normal" }}>
                    {s.course}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.room}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.days}</div>
                </div>
              );
            })}
          </div>
          {teacher.subjects?.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px 24px", marginTop: 1 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Assigned Subjects</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {teacher.subjects.map((s: string) => (
                  <span key={s} style={{ fontSize: 12, padding: "6px 14px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--navy)" }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}