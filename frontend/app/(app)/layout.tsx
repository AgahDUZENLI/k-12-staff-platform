import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: 220,
        padding: "48px 56px",
        minHeight: "100vh",
        background: "var(--bg)",
      }}>
        {children}
      </main>
    </div>
  );
}