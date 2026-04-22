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
      <main className="flex-1 md:ml-[200px] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8 pb-20 md:pb-8">
          {view === "gold" && <GoldView />}
          {view === "apartment" && <ApartmentView />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav active={view} onChange={setView} />
    </div>
  );
}
