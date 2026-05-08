"use client";
import { useEffect, useState } from "react";
import { getDashboard, DashboardData } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then((r) => { setData(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-gray-400 pt-10">Loading...</div>;
  if (!data) return null;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F2240]">Dashboard</h1>
        <p className="text-gray-500 mt-1">Lincoln Elementary — May 2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observations This Month</div>
          <div className="text-4xl font-bold text-[#0F2240]">{data.observations_this_month}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pending Reviews</div>
          <div className="text-4xl font-bold text-[#0F2240]">{data.pending_reviews}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Open Goals</div>
          <div className="text-4xl font-bold text-[#0F2240]">{data.open_goals}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Flagged Staff */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-[#0F2240] mb-4 uppercase tracking-wide">Flagged Staff</h2>
          {data.flagged_staff.length === 0 ? (
            <p className="text-gray-400 text-sm">No flagged staff this month.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.flagged_staff.map((s) => (
                <Link key={s.id} href={`/staff/${s.id}`}
                  className="flex items-center gap-2 text-sm text-red-600 hover:underline">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Observations */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-[#0F2240] mb-4 uppercase tracking-wide">Recent Observations</h2>
          <div className="flex flex-col gap-3">
            {data.recent_observations.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{o.teacher_name}</span>
                  <span className="text-gray-400 ml-2">{o.observed_at}</span>
                </div>
                {o.flagged && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Flagged</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}