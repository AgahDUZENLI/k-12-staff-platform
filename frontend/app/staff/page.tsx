"use client";
import { useEffect, useState } from "react";
import { getStaff, Teacher } from "@/lib/api";
import Link from "next/link";

export default function StaffPage() {
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getStaff().then((r) => { setStaff(r.data); setLoading(false); });
  }, []);

  const filtered = staff.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-gray-400 pt-10">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F2240]">Staff Directory</h1>
        <p className="text-gray-500 mt-1">{staff.length} teachers</p>
      </div>

      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm mb-6 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2240]/20"
      />

      <div className="flex flex-col gap-3">
        {filtered.map((teacher) => (
          <Link key={teacher.id} href={`/staff/${teacher.id}`}
            className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center justify-between hover:border-[#0F2240]/30 transition-colors">
            <div>
              <div className="font-semibold text-[#0F2240]">{teacher.name}</div>
              <div className="text-sm text-gray-400">{teacher.email}</div>
            </div>
            <span className="text-xs text-gray-400">View Profile →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}