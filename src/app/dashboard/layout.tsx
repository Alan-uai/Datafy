
import { Header } from "@/components/shared/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
