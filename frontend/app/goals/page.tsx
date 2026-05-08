"use client";
import { useEffect, useState } from "react";
import { getStaff, createGoal, updateGoal, Teacher } from "@/lib/api";
import axios from "axios";

const ADMIN_ID = "00000000-0000-0000-0000-000000000010";

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-600",
  achieved: "bg-green-100 text-green-600",
};

export default function GoalsPage() {
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [progressNote, setProgressNote] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getStaff().then((r) => setStaff(r.data));
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const r = await axios.get("http://localhost:8000/goals");
    setGoals(r.data);
  };

  const handleCreate = async () => {
    if (!teacherId || !title) return alert("Select a teacher and enter a title.");
    setCreating(true);
    await createGoal({ teacher_id: teacherId, set_by: ADMIN_ID, title, description, target_date: targetDate || null });
    setTitle(""); setDescription(""); setTargetDate(""); setTeacherId("");
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
    await updateGoal(goalId, { progress_note: note });
    setProgressNote({ ...progressNote, [goalId]: "" });
    await fetchGoals();
  };

  const teacherName = (id: string) => staff.find((t) => t.id === id)?.name || "Unknown";

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F2240]">Goal Tracking</h1>
        <p className="text-gray-500 mt-1">Set and monitor staff development goals</p>
      </div>

      {/* Create Goal */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-sm font-semibold text-[#0F2240] uppercase tracking-wide mb-4">Create New Goal</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Teacher</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option value="">Select...</option>
              {staff.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Target Date</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Goal Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Improve classroom management score"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} placeholder="Describe the goal in detail..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
        </div>
        <button onClick={handleCreate} disabled={creating}
          className="bg-[#0F2240] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#1a3a5c] disabled:opacity-50">
          {creating ? "Creating..." : "Create Goal"}
        </button>
      </div>

      {/* Goals List */}
      <div className="flex flex-col gap-4">
        {goals.map((g: any) => (
          <div key={g.id} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-[#0F2240]">{g.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{teacherName(g.teacher_id)}</div>
              </div>
              <div className="flex items-center gap-2">
                <select value={g.status} onChange={(e) => handleStatusChange(g.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[g.status]}`}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="achieved">Achieved</option>
                </select>
              </div>
            </div>
            {g.description && <p className="text-sm text-gray-500 mb-3">{g.description}</p>}
            {g.target_date && <p className="text-xs text-gray-400 mb-3">Due: {g.target_date}</p>}

            {/* Progress note input */}
            <div className="flex gap-2 mt-3">
              <input
                value={progressNote[g.id] || ""}
                onChange={(e) => setProgressNote({ ...progressNote, [g.id]: e.target.value })}
                placeholder="Log a progress update..."
                className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none"
              />
              <button onClick={() => handleProgressNote(g.id)}
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200">
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}