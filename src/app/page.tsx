"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import GoldView from "@/components/GoldView";
import ApartmentView from "@/components/ApartmentView";

export default function Home() {
  const [view, setView] = useState<"gold" | "apartment">("gold");

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <Sidebar active={view} onChange={setView} />

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-10">
          {view === "gold" && <GoldView />}
          {view === "apartment" && <ApartmentView />}
          {/* Clearance for mobile bottom nav */}
          <div className="h-16 md:hidden" />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav active={view} onChange={setView} />
    </div>
  );
}
