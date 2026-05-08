"use client";
import { useEffect, useState } from "react";
import { getStaff, createObservation, Teacher } from "@/lib/api";
import { useRouter } from "next/navigation";

const ADMIN_ID = "00000000-0000-0000-0000-000000000010";

const DOMAINS = [
  { key: "classroom_environment",       label: "Classroom Environment" },
  { key: "instruction",                 label: "Instruction & Delivery" },
  { key: "planning",                    label: "Planning & Preparation" },
  { key: "student_engagement",          label: "Student Engagement" },
  { key: "professional_responsibilities",label: "Professional Responsibilities" },
];

const FRAMEWORKS = [
  { value: "5e",                label: "5E Model" },
  { value: "gradual_release",  label: "Gradual Release" },
  { value: "direct_instruction",label: "Direct Instruction" },
  { value: "collaborative",    label: "Collaborative / Discovery" },
  { value: "general",          label: "General" },
];

const TYPES = ["formal", "informal", "walkthrough"];

const SECTIONS = [
  "lesson_overview", "lesson_structure", "student_participation",
  "questioning_strategies", "classroom_management", "time_management",
];

const SECTION_LABELS: Record<string, string> = {
  lesson_overview: "Lesson Overview",
  lesson_structure: "Lesson Structure",
  student_participation: "Student Participation & Equity",
  questioning_strategies: "Questioning Strategies",
  classroom_management: "Classroom Management",
  time_management: "Time Management",
};

const SCORE_LABELS: Record<number, string> = {
  1: "Unsatisfactory", 2: "Basic", 3: "Proficient", 4: "Distinguished"
};

export default function NewObservationPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("formal");
  const [framework, setFramework] = useState("5e");
  const [course, setCourse] = useState("");
  const [room, setRoom] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({
    classroom_environment: 3, instruction: 3, planning: 3, student_engagement: 3, professional_responsibilities: 3,
  });
  const [sectionNotes, setSectionNotes] = useState<Record<string, string>>({});
  const [rawNotes, setRawNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { getStaff().then(r => setStaff(r.data)); }, []);

  const handleSubmit = async () => {
    if (!teacherId) return alert("Select a teacher.");
    setLoading(true);
    try {
      const r = await createObservation({
        teacher_id: teacherId, observer_id: ADMIN_ID,
        observed_at: date, observation_type: type,
        framework, course_name: course, room,
        scores, section_notes: sectionNotes, raw_notes: rawNotes,
      });
      setResult(r.data);
    } catch (e) { alert("Submission failed."); }
    setLoading(false);
  };

  if (result) {
    const avg = (Object.values(result.scores) as number[]).reduce((a, b) => a + b, 0) / Object.values(result.scores).length;
    return (
      <div style={{ maxWidth: 680 }}>
        <div className="fade-up-1" style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, color: "var(--navy)" }}>Observation Submitted</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
            {staff.find(t => t.id === teacherId)?.name} · {result.observed_at}
          </p>
        </div>

        <div className="fade-up-2" style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontFamily: "'DM Serif Display',serif", color: "var(--navy)" }}>
              Average: {avg.toFixed(1)}/4
            </div>
            {result.flagged && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--amber)", fontSize: 13, fontWeight: 500 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)" }} />
                Flagged for concern
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
            {Object.entries(result.scores).map(([k, v]: any) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontFamily: "'DM Serif Display',serif", color: v >= 4 ? "var(--green)" : v <= 2 ? "var(--red)" : "var(--navy)" }}>{v}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize", marginTop: 2 }}>{k.replace(/_/g," ")}</div>
              </div>
            ))}
          </div>
          {result.ai_summary && (
            <div style={{ borderLeft: "3px solid var(--amber)", paddingLeft: 16 }}>
              <div style={{ fontSize: 10, color: "var(--amber)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>✦ AI Summary</div>
              <p style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.7 }}>{result.ai_summary}</p>
            </div>
          )}
        </div>

        <div className="fade-up-3" style={{ display: "flex", gap: 12 }}>
          <button onClick={() => router.push(`/staff/${teacherId}`)} style={{
            background: "var(--navy)", color: "#fff", border: "none",
            padding: "12px 24px", fontSize: 13, cursor: "pointer",
          }}>View Profile</button>
          <button onClick={() => { setResult(null); setTeacherId(""); setRawNotes(""); setSectionNotes({}); }} style={{
            background: "none", color: "var(--navy)", border: "1px solid var(--border)",
            padding: "12px 24px", fontSize: 13, cursor: "pointer",
          }}>New Observation</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="fade-up-1" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          Classroom Observation
        </div>
        <h1 style={{ fontSize: 36, color: "var(--navy)" }}>New Observation</h1>
      </div>

      <div className="fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Header fields */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px", marginBottom: 1 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Observation Header</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Teacher</label>
              <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={inputStyle}>
                <option value="">Select teacher...</option>
                {staff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Framework</label>
              <select value={framework} onChange={e => setFramework(e.target.value)} style={inputStyle}>
                {FRAMEWORKS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Course</label>
              <input value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. Algebra I" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Room</label>
              <input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. 204" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Rubric scores */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px", marginBottom: 1 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Domain Ratings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {DOMAINS.map(d => (
              <div key={d.key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
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
                      cursor: "pointer", transition: "all 0.15s",
                    }}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section notes */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px", marginBottom: 1 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Section Notes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SECTIONS.map(s => (
              <div key={s}>
                <label style={{ fontSize: 12, color: "var(--text-mid)", display: "block", marginBottom: 6, fontWeight: 500 }}>{SECTION_LABELS[s]}</label>
                <textarea
                  value={sectionNotes[s] || ""}
                  onChange={e => setSectionNotes({...sectionNotes, [s]: e.target.value})}
                  rows={2}
                  placeholder={`Notes on ${SECTION_LABELS[s].toLowerCase()}...`}
                  style={{ ...inputStyle, resize: "none" as any }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Overall notes */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Overall Notes</div>
          <textarea
            value={rawNotes}
            onChange={e => setRawNotes(e.target.value)}
            rows={4}
            placeholder="General observation notes..."
            style={{ ...inputStyle, resize: "none" as any }}
          />
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          background: loading ? "rgba(13,27,42,0.5)" : "var(--navy)",
          color: "#fff", border: "none",
          padding: "16px", fontSize: 14, fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: "0.02em",
        }}>
          {loading ? "Submitting & generating AI summary..." : "Submit Observation"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid var(--border)",
  background: "var(--bg)", fontSize: 13,
  color: "var(--text)", outline: "none",
  fontFamily: "'DM Sans', sans-serif",
};