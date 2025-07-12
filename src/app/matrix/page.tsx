
"use client";

import DashboardComponent from "@/app/page";
import { Header } from "@/components/shared/Header";

export default function MatrixPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <Header />
      <main className="flex-1">
        <DashboardComponent />
      </main>
    </div>
  );
}
