import Dashboard from "@/app/dashboard/page";
import { Header } from "@/components/shared/Header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen text-foreground">
      <Header />
      <main className="flex-1">
        <Dashboard />
      </main>
    </div>
  );
}
