
"use client";

import Dashboard from "@/app/dashboard/page";
import { Header } from "@/components/shared/Header";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <Header />
      <main className="flex-1">
        <Dashboard />
      </main>
    </div>
  );
}
