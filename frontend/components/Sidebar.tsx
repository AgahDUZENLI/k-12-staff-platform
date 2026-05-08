"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/staff", label: "Staff" },
  { href: "/observations/new", label: "New Observation" },
  { href: "/reviews/new", label: "New Review" },
  { href: "/goals", label: "Goals" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#0F2240] flex flex-col py-8 px-5 z-50">
      <div className="mb-10">
        <div className="text-white text-lg font-bold leading-tight">StaffSync</div>
        <div className="text-[#7BA7E8] text-xs mt-1">K-12 Admin Platform</div>
      </div>

      <div className="mb-6">
        <div className="text-[#7BA7E8] text-xs font-semibold uppercase tracking-widest mb-3">Menu</div>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-2 rounded transition-colors ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-[#A5C3FF] hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto">
        <div className="border border-white/10 rounded p-3">
          <div className="text-white text-xs font-semibold">Sarah Mitchell</div>
          <div className="text-[#7BA7E8] text-xs">Administrator</div>
        </div>
      </div>
    </aside>
  );
}