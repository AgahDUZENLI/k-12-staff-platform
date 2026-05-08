"use client";
import { useEffect, useState } from "react";
import { getStaff, getStaffById, getReviewSuggestions, createReview, Teacher } from "@/lib/api";
import { useRouter } from "next/navigation";
import axios from "axios";

const ADMIN_ID = "00000000-0000-0000-0000-000000000010";
const API = "http://localhost:8000";

const DIMENSIONS = [
  { key: "instructional_effectiveness", label: "Instructional Effectiveness" },
  { key: "classroom_management",        label: "Classroom Management" },
  { key: "student_engagement",          label: "Student Engagement" },
  { key: "professional_responsibilities",label: "Professional Responsibilities" },
  { key: "growth_and_improvement",      label: "Growth & Improvement" },
];

const SCORE_LABELS: Record<number, string> = {
  1: "Unsatisfactory", 2: "Basic", 3: "Proficient", 4: "Distinguished"
};

export default function NewReviewPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [teacherData, setTeacherData] = useState<any>(null);
  const [period, setPeriod] = useState("Spring 2026");
  const [scores, setScores] = useState<Record<string, number>>({
    instructional_effectiveness: 3, classroom_management: 3,
    student_engagement: 3, professional_responsibilities: 3, growth_and_improvement: 3,
  });
  const [finalNotes, setFinalNotes] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { getStaff().then(r => setStaff(r.data)); }, []);

  const handleTeacherSelect = async (id: string) => {
    setTeacherId(id);
    if (!id) return;
    setLoading(true);
    try {
      const [profileRes, sugRes] = await Promise.all([
        getStaffById(id),
        getReviewSuggestions(id),
      ]);
      setTeacherData(profileRes.data);
      setSuggestions(sugRes.data.suggestions);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!teacherId) return alert("Select a teacher.");
    setSubmitting(true);
    try {
      const r = await createReview({
        teacher_id: teacherId, reviewer_id: ADMIN_ID,
        period, category_scores: scores, final_notes: finalNotes,
      });
      await axios.patch(`${API}/reviews/${r.data.id}`, { status: "pending_signoff" });
      setDone(true);
    } catch (e) { alert("Submission failed."); }
    setSubmitting(false);
  };

  if (done) return (
    <div style={{ maxWidth: 680 }}>
      <div className="fade-up-1" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, color: "var(--navy)" }}>Review Submitted</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
          The review is pending teacher sign-off.
        </p>
      </div>
      <button onClick={() => router.push(`/staff/${teacherId}`)} style={{
        background: "var(--navy)", color: "#fff", border: "none",
        padding: "12px 24px", fontSize: 13, cursor: "pointer",
      }}>View Teacher Profile</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="fade-up-1" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Performance Review</div>
        <h1 style={{ fontSize: 36, color: "var(--navy)" }}>New Review</h1>
      </div>

      <div className="fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {/* Select teacher */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "24px", marginBottom: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Teacher</label>
              <select value={teacherId} onChange={e => handleTeacherSelect(e.target.value)} style={inputStyle}>
                <option value="">Select...</option>
                {staff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Review Period</label>
              <input value={period} onChange={e => setPeriod(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Observation history */}
        {loading && <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px 24px", color: "var(--text-muted)", fontSize: 13 }}>Loading teacher data...</div>}

        {teacherData && teacherData.observations.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "24px", marginBottom: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Observation History</div>
            {teacherData.observations.slice(0, 4).map((o: any) => {
              const avg = (Object.values(o.scores) as number[]).reduce((a, b) => a + b, 0) / Object.values(o.scores).length;
              return (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--text-mid)" }}>{o.observed_at} · {o.framework}</span>
                  <span style={{ fontWeight: 500, color: avg >= 3.5 ? "var(--green)" : avg <= 2 ? "var(--red)" : "var(--navy)" }}>
                    {avg.toFixed(1)}/4
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* AI suggestions */}
        {suggestions.length > 0 && (
          <div style={{ borderLeft: "3px solid var(--amber)", background: "var(--surface)", padding: "20px 24px", border: "1px solid var(--border)", marginBottom: 1 }}>
            <div style={{ fontSize: 10, color: "var(--amber)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>✦ AI Goal Suggestions</div>
            {suggestions.map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: "var(--text-mid)", padding: "8px 0", borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none", lineHeight: 1.5 }}>
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Dimension scores */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px", marginBottom: 1 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Dimension Ratings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {DIMENSIONS.map(d => (
              <div key={d.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{d.label}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{SCORE_LABELS[scores[d.key]]}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1,2,3,4].map(v => (
                    <button key={v} onClick={() => setScores({...scores, [d.key]: v})} style={{
                      flex: 1, padding: "10px", fontSize: 14,
                      fontFamily: "'DM Serif Display',serif",
                      background: scores[d.key] === v ? "var(--navy)" : "var(--bg)",
                      color: scores[d.key] === v ? "#fff" : "var(--text-mid)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final notes */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px", marginBottom: 24 }}>
          <label style={labelStyle}>Final Evaluation Notes</label>
          <textarea
            value={finalNotes}
            onChange={e => setFinalNotes(e.target.value)}
            rows={5}
            placeholder="Write your performance evaluation..."
            style={{ ...inputStyle, resize: "none" as any, marginTop: 8 }}
          />
        </div>

        <button onClick={handleSubmit} disabled={submitting} style={{
          background: submitting ? "rgba(13,27,42,0.5)" : "var(--navy)",
          color: "#fff", border: "none",
          padding: "16px", fontSize: 14, fontWeight: 500,
          cursor: submitting ? "not-allowed" : "pointer",
        }}>
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: "var(--text-muted)", display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid var(--border)",
  background: "var(--bg)", fontSize: 13,
  color: "var(--text)", outline: "none",
  fontFamily: "'DM Sans', sans-serif",
};