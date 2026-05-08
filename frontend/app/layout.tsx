import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAKAS — K-12 Administration System",
  description: "Dynamic Active K-12 Administration System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}