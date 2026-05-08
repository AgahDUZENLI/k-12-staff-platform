"use client";
import { useEffect, useState } from "react";
import { getStaff, createGoal, updateGoal, Teacher } from "@/lib/api";
import axios from "axios";

const ADMIN_ID = "00000000-0000-0000-0000-000000000010";
const API = "http://localhost:8000";

const STATUS_COLOR: Record<string, string> = {
  not_started: "#9AA0A6", in_progress: "#1A56DB",
  at_risk: "#E8A020", achieved: "#2D7A4F", not_met: "#C0392B",
};

const DIMENSIONS = [
  "instructional_effectiveness","classroom_management",
  "student_engagement","professional_responsibilities","growth_and_improvement",
];

export default function GoalsPage() {
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dimension, setDimension] = useState("");
  const [evidenceType, setEvidenceType] = useState("observation_score");
  const [targetDate, setTargetDate] = useState("");
  const [progressNote, setProgressNote] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getStaff().then(r => setStaff(r.data));
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const r = await axios.get(`${API}/goals`);
    setGoals(r.data);
  };

  const handleCreate = async () => {
    if (!teacherId || !title) return alert("Select teacher and enter title.");
    setCreating(true);
    await createGoal({
      teacher_id: teacherId, set_by: ADMIN_ID,
      title, description, linked_dimension: dimension,
      evidence_type: evidenceType, target_date: targetDate || null,
    });
    setTitle(""); setDescription(""); setTeacherId(""); setDimension(""); setTargetDate("");
    await fetchGoals();
    setCreating(false);
  };

  const handleStatusChange = async (goalId: string, status: string) => {
    await updateGoal(goalId, { status });
    await fetchGoals();
  };

  const handleProgressNote = async (goalId: string) => {
    const note = progressNote[goalId];
    if (!note) return;
    await updateGoal(goalId, { progress_note: note, author_id: ADMIN_ID });
    setProgressNote({ ...progressNote, [goalId]: "" });
    await fetchGoals();
  };

  const teacherName = (id: string) => staff.find(t => t.id === id)?.name || "Unknown";

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="fade-up-1" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Goal Tracking</div>
        <h1 style={{ fontSize: 36, color: "var(--navy)" }}>Goals</h1>
      </div>

      {/* Create goal */}
      <div className="fade-up-2" style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px", marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Create New Goal</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Teacher</label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={inputStyle}>
              <option value="">Select...</option>
              {staff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Linked Dimension</label>
            <select value={dimension} onChange={e => setDimension(e.target.value)} style={inputStyle}>
              <option value="">None</option>
              {DIMENSIONS.map(d => <option key={d} value={d}>{d.replace(/_/g," ")}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Target Date</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Goal Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Improve classroom management to proficient" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Success criteria and context..." style={{ ...inputStyle, resize: "none" as any }} />
        </div>
        <button onClick={handleCreate} disabled={creating} style={{
          background: creating ? "rgba(13,27,42,0.5)" : "var(--navy)",
          color: "#fff", border: "none", padding: "11px 24px",
          fontSize: 13, cursor: creating ? "not-allowed" : "pointer",
        }}>
          {creating ? "Creating..." : "Create Goal"}
        </button>
      </div>

      {/* Goals list */}
      <div className="fade-up-3" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
        All Goals ({goals.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
        {goals.map((g: any) => (
          <div key={g.id} style={{ background: "var(--surface)", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{g.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{teacherName(g.teacher_id)}</div>
              </div>
              <select
                value={g.status}
                onChange={e => handleStatusChange(g.id, e.target.value)}
                style={{
                  border: "none", background: "none",
                  fontSize: 12, fontWeight: 500,
                  color: STATUS_COLOR[g.status] || "var(--text-muted)",
                  cursor: "pointer", outline: "none",
                  flexShrink: 0, marginLeft: 16,
                }}
              >
                {["not_started","in_progress","at_risk","achieved","not_met"].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g," ")}</option>
                ))}
              </select>
            </div>
            {g.description && <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>{g.description}</p>}
            {g.target_date && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>Due {g.target_date}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={progressNote[g.id] || ""}
                onChange={e => setProgressNote({ ...progressNote, [g.id]: e.target.value })}
                placeholder="Log a progress update..."
                style={{ ...inputStyle, flex: 1, fontSize: 12 }}
                onKeyDown={e => e.key === "Enter" && handleProgressNote(g.id)}
              />
              <button onClick={() => handleProgressNote(g.id)} style={{
                background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--text-mid)", padding: "0 16px", fontSize: 12,
                cursor: "pointer", flexShrink: 0,
              }}>Add</button>
            </div>
          </div>
        ))}
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