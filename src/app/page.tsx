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
      <main className="flex-1 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 pb-24 md:pb-12">
          {view === "gold" && <GoldView />}
          {view === "apartment" && <ApartmentView />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav active={view} onChange={setView} />
    </div>
  );
}
