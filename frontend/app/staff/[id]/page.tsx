"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getStaffById, getStaffSummary, acknowledgeReview } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-600",
  achieved: "bg-green-100 text-green-600",
  draft: "bg-yellow-100 text-yellow-600",
  submitted: "bg-blue-100 text-blue-600",
  acknowledged: "bg-green-100 text-green-600",
};

const TAG_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  concern: "bg-red-100 text-red-700",
  neutral: "bg-gray-100 text-gray-600",
};

export default function StaffProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("observations");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStaffById(id as string).then((r) => { setData(r.data); setLoading(false); });
  }, [id]);

  const handleSummary = async () => {
    setSummaryLoading(true);
    const r = await getStaffSummary(id as string);
    setSummary(r.data.summary);
    setSummaryLoading(false);
  };

  const handleAcknowledge = async (reviewId: string) => {
    await acknowledgeReview(reviewId);
    const r = await getStaffById(id as string);
    setData(r.data);
  };

  if (loading) return <div className="text-gray-400 pt-10">Loading...</div>;
  if (!data) return null;

  const { teacher, observations, reviews, notes, goals } = data;
  const tabs = ["observations", "reviews", "notes", "goals"];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F2240]">{teacher.name}</h1>
          <p className="text-gray-400 mt-1">{teacher.email}</p>
        </div>
        <button onClick={handleSummary} disabled={summaryLoading}
          className="bg-[#0F2240] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#1a3a5c] transition-colors disabled:opacity-50">
          {summaryLoading ? "Generating..." : "✦ AI Staff Summary"}
        </button>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">✦ AI Generated Summary</div>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-[#0F2240] text-[#0F2240] font-medium"
                : "text-gray-400 hover:text-gray-600"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Observations */}
      {tab === "observations" && (
        <div className="flex flex-col gap-4">
          {observations.length === 0 && <p className="text-gray-400 text-sm">No observations yet.</p>}
          {observations.map((o: any) => (
            <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{o.observed_at}</span>
                {o.flagged && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Flagged</span>
                )}
              </div>
              <div className="flex gap-4 mb-3">
                {Object.entries(o.scores).map(([k, v]: any) => (
                  <div key={k} className="text-center">
                    <div className="text-lg font-bold text-[#0F2240]">{v}</div>
                    <div className="text-xs text-gray-400 capitalize">{k}</div>
                  </div>
                ))}
              </div>
              {o.ai_summary && (
                <div className="bg-blue-50 rounded p-3 mt-2">
                  <div className="text-xs text-blue-400 mb-1">✦ AI Summary</div>
                  <p className="text-sm text-gray-600">{o.ai_summary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reviews */}
      {tab === "reviews" && (
        <div className="flex flex-col gap-4">
          {reviews.length === 0 && <p className="text-gray-400 text-sm">No reviews yet.</p>}
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-[#0F2240]">{r.period}</span>
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_COLORS[r.status] || ""}`}>
                  {r.status}
                </span>
              </div>
              <div className="flex gap-4 mb-3">
                {Object.entries(r.category_scores).map(([k, v]: any) => (
                  <div key={k} className="text-center">
                    <div className="text-lg font-bold text-[#0F2240]">{v}</div>
                    <div className="text-xs text-gray-400 capitalize">{k}</div>
                  </div>
                ))}
              </div>
              {r.final_notes && <p className="text-sm text-gray-600 mb-3">{r.final_notes}</p>}
              {r.ai_summary && (
                <div className="bg-blue-50 rounded p-3 mb-3">
                  <div className="text-xs text-blue-400 mb-1">✦ AI Summary</div>
                  <p className="text-sm text-gray-600">{r.ai_summary}</p>
                </div>
              )}
              {r.status === "submitted" && (
                <button onClick={() => handleAcknowledge(r.id)}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {tab === "notes" && (
        <div className="flex flex-col gap-3">
          {notes.length === 0 && <p className="text-gray-400 text-sm">No notes yet.</p>}
          {notes.map((n: any) => (
            <div key={n.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${TAG_COLORS[n.tag] || ""}`}>{n.tag}</span>
                <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700">{n.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Goals */}
      {tab === "goals" && (
        <div className="flex flex-col gap-4">
          {goals.length === 0 && <p className="text-gray-400 text-sm">No goals yet.</p>}
          {goals.map((g: any) => (
            <div key={g.id} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[#0F2240]">{g.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_COLORS[g.status] || ""}`}>
                  {g.status.replace("_", " ")}
                </span>
              </div>
              {g.description && <p className="text-sm text-gray-500 mb-3">{g.description}</p>}
              {g.target_date && (
                <p className="text-xs text-gray-400 mb-3">Due: {g.target_date}</p>
              )}
              {g.updates?.length > 0 && (
                <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-2">
                  {g.updates.map((u: any) => (
                    <div key={u.id} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-gray-300">—</span>
                      <span>{u.content}</span>
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