"use client";
import { useEffect, useState } from "react";
import { getStaff, createObservation, Teacher } from "@/lib/api";
import { useRouter } from "next/navigation";

const ADMIN_ID = "00000000-0000-0000-0000-000000000010";
const CATEGORIES = ["instruction", "management", "engagement"];

export default function NewObservationPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [scores, setScores] = useState({ instruction: 3, management: 3, engagement: 3 });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    getStaff().then((r) => setStaff(r.data));
  }, []);

  const handleSubmit = async () => {
    if (!teacherId) return alert("Select a teacher.");
    setLoading(true);
    const r = await createObservation({
      teacher_id: teacherId,
      observer_id: ADMIN_ID,
      observed_at: date,
      scores,
      raw_notes: notes,
    });
    setResult(r.data);
    setLoading(false);
  };

  if (result) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0F2240]">Observation Submitted</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            {result.flagged && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Flagged</span>
            )}
            <span className="text-sm text-gray-400">{result.observed_at}</span>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-xs text-blue-400 font-semibold mb-2">✦ AI Generated Summary</div>
            <p className="text-sm text-gray-700 leading-relaxed">{result.ai_summary}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push(`/staff/${teacherId}`)}
            className="bg-[#0F2240] text-white text-sm px-4 py-2 rounded-lg">
            View Teacher Profile
          </button>
          <button onClick={() => { setResult(null); setNotes(""); setTeacherId(""); }}
            className="border border-gray-200 text-sm px-4 py-2 rounded-lg text-gray-600">
            New Observation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F2240]">New Observation</h1>
        <p className="text-gray-500 mt-1">Record a classroom observation</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Teacher</label>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2240]/20">
            <option value="">Select a teacher...</option>
            {staff.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2240]/20" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">Scores (1–5)</label>
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
                <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={4} placeholder="Describe what you observed..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2240]/20 resize-none" />
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="bg-[#0F2240] text-white text-sm px-5 py-2.5 rounded-lg hover:bg-[#1a3a5c] transition-colors disabled:opacity-50 w-full">
          {loading ? "Submitting & generating AI summary..." : "Submit Observation"}
        </button>
      </div>
    </div>
  );
}