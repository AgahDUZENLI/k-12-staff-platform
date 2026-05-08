import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "StaffSync — K-12 Performance Platform",
  description: "K-12 Staff Performance & Administration Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F7F7F5] text-[#1a1a1a] min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-56 p-8 min-h-screen">{children}</main>
      </body>
    </html>
  );
}