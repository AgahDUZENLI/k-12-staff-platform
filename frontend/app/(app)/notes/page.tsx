"use client";
import { useEffect, useState } from "react";
import { getStaff, createNote, Teacher } from "@/lib/api";
import axios from "axios";

const ADMIN_ID = "00000000-0000-0000-0000-000000000010";
const API = "http://localhost:8000";

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  commendation: { bg: "#EBF7F0", color: "#2D7A4F" },
  concern:      { bg: "#FDF0EE", color: "#C0392B" },
  coaching:     { bg: "#EBF2FF", color: "#1A56DB" },
  pd:           { bg: "#FFF8EC", color: "#E8A020" },
  general:      { bg: "#F5F5F5", color: "#4A5568" },
};

export default function NotesPage() {
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("general");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getStaff().then(r => setStaff(r.data));
    fetchAllNotes();
  }, []);

  const fetchAllNotes = async () => {
    // Fetch notes for all teachers and combine
    const teacherRes = await axios.get(`${API}/staff`);
    const allNotes: any[] = [];
    for (const t of teacherRes.data) {
      const res = await axios.get(`${API}/notes?teacher_id=${t.id}`);
      allNotes.push(...res.data.map((n: any) => ({ ...n, teacher_name: t.name })));
    }
    allNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotes(allNotes);
  };

  const handleSubmit = async () => {
    if (!teacherId || !content.trim()) return alert("Select a teacher and write a note.");
    setSubmitting(true);
    await createNote({ teacher_id: teacherId, author_id: ADMIN_ID, content, tag, pinned: false });
    setContent(""); setTeacherId(""); setTag("general");
    await fetchAllNotes();
    setSubmitting(false);
  };

  const filtered = notes.filter(n =>
    (!filterTeacher || n.teacher_name === filterTeacher) &&
    (!filterTag || n.tag === filterTag)
  );

  const teacherName = (id: string) => staff.find(t => t.id === id)?.name || "";

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="fade-up-1" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          Documentation
        </div>
        <h1 style={{ fontSize: 36, color: "var(--navy)" }}>Notes</h1>
      </div>

      {/* Add note form */}
      <div className="fade-up-2" style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "24px", marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>New Note</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Staff Member</label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={inputStyle}>
              <option value="">Select teacher...</option>
              {staff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tag</label>
            <select value={tag} onChange={e => setTag(e.target.value)} style={inputStyle}>
              <option value="commendation">Commendation</option>
              <option value="concern">Concern</option>
              <option value="coaching">Coaching</option>
              <option value="pd">PD</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          placeholder="Write your note..."
          style={{ ...inputStyle, resize: "none" as any, marginBottom: 14 }}
        />
        <button onClick={handleSubmit} disabled={submitting} style={{
          background: submitting ? "rgba(13,27,42,0.4)" : "var(--navy)",
          color: "#fff", border: "none",
          padding: "10px 24px", fontSize: 13,
          cursor: submitting ? "not-allowed" : "pointer",
        }}>
          {submitting ? "Saving..." : "Add Note"}
        </button>
      </div>

      {/* Filters */}
      <div className="fade-up-3" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="">All Staff</option>
          {staff.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="">All Tags</option>
          <option value="commendation">Commendation</option>
          <option value="concern">Concern</option>
          <option value="coaching">Coaching</option>
          <option value="pd">PD</option>
          <option value="general">General</option>
        </select>
        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
          {filtered.length} notes
        </div>
      </div>

      {/* Notes list */}
      <div className="fade-up-4" style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
        {filtered.length === 0 && (
          <div style={{ background: "var(--surface)", padding: "24px", color: "var(--text-muted)", fontSize: 13 }}>No notes found.</div>
        )}
        {filtered.map((n: any) => {
          const ts = TAG_STYLE[n.tag] || TAG_STYLE.general;
          return (
            <div key={n.id} style={{ background: "var(--surface)", padding: "20px 24px", display: "flex", gap: 16 }}>
              {n.pinned && <div style={{ color: "var(--amber)", fontSize: 14, flexShrink: 0, marginTop: 2 }}>◆</div>}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)" }}>{n.teacher_name}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: ts.bg, color: ts.color, textTransform: "capitalize" }}>
                    {n.tag}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
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