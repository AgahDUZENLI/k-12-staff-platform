"use client";
import { useEffect, useState } from "react";
import { getStaff, getStaffById, getReviewSuggestions, createReview, submitReview, Teacher } from "@/lib/api";
import { useRouter } from "next/navigation";

const ADMIN_ID = "00000000-0000-0000-0000-000000000010";
const CATEGORIES = ["professionalism", "collaboration", "instruction", "growth"];

export default function NewReviewPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [teacherData, setTeacherData] = useState<any>(null);
  const [period, setPeriod] = useState("Q2 2026");
  const [scores, setScores] = useState({ professionalism: 3, collaboration: 3, instruction: 3, growth: 3 });
  const [finalNotes, setFinalNotes] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewId, setReviewId] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    getStaff().then((r) => setStaff(r.data));
  }, []);

  const handleTeacherSelect = async (id: string) => {
    setTeacherId(id);
    if (!id) return;
    setLoading(true);
    const [profileRes, sugRes] = await Promise.all([
      getStaffById(id),
      getReviewSuggestions(id),
    ]);
    setTeacherData(profileRes.data);
    setSuggestions(sugRes.data.suggestions);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!teacherId) return alert("Select a teacher.");
    setSubmitting(true);
    const r = await createReview({
      teacher_id: teacherId,
      reviewer_id: ADMIN_ID,
      period,
      category_scores: scores,
      final_notes: finalNotes,
    });
    setReviewId(r.data.id);
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!reviewId) return handleCreate();
    setSubmitting(true);
    await submitReview(reviewId);
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-[#0F2240] mb-4">Review Submitted</h1>
        <p className="text-gray-500 mb-6">The performance review has been submitted. The teacher can now acknowledge it.</p>
        <button onClick={() => router.push(`/staff/${teacherId}`)}
          className="bg-[#0F2240] text-white text-sm px-4 py-2 rounded-lg">
          View Teacher Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F2240]">New Performance Review</h1>
        <p className="text-gray-500 mt-1">Conduct a formal staff evaluation</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Teacher</label>
          <select value={teacherId} onChange={(e) => handleTeacherSelect(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="">Select a teacher...</option>
            {staff.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {loading && <p className="text-sm text-gray-400">Loading teacher data...</p>}

        {/* Observation history summary */}
        {teacherData && teacherData.observations.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Observation History</div>
            {teacherData.observations.slice(0, 3).map((o: any) => (
              <div key={o.id} className="flex justify-between text-sm text-gray-600 py-1 border-b border-gray-100 last:border-0">
                <span>{o.observed_at}</span>
                <span>{Object.entries(o.scores).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="text-xs text-blue-400 font-semibold mb-2">✦ AI Goal Suggestions</div>
            {suggestions.map((s, i) => (
              <p key={i} className="text-sm text-gray-700 py-1 border-b border-blue-100 last:border-0">{s}</p>
            ))}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Review Period</label>
          <input value={period} onChange={(e) => setPeriod(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">Category Scores (1–5)</label>
          <div className="flex flex-col gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-gray-600">{cat}</span>
                  <span className="font-bold text-[#0F2240]">{scores[cat as keyof typeof scores]}</span>
                </div>
                <input type="range" min={1} max={5} step={1}
                  value={scores[cat as keyof typeof scores]}
                  onChange={(e) => setScores({ ...scores, [cat]: parseInt(e.target.value) })}
                  className="w-full accent-[#0F2240]" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Final Notes</label>
          <textarea value={finalNotes} onChange={(e) => setFinalNotes(e.target.value)}
            rows={4} placeholder="Write your evaluation notes..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={handleCreate} disabled={submitting}
            className="flex-1 border border-[#0F2240] text-[#0F2240] text-sm px-4 py-2.5 rounded-lg hover:bg-[#0F2240]/5 disabled:opacity-50">
            {submitting ? "Saving..." : "Save as Draft"}
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 bg-[#0F2240] text-white text-sm px-4 py-2.5 rounded-lg hover:bg-[#1a3a5c] disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}