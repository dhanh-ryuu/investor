"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import GoldView from "@/components/GoldView";
import ApartmentView from "@/components/ApartmentView";

export default function Home() {
  const [view, setView] = useState<"gold" | "apartment">("gold");

  return (
    <main>
      <NavBar active={view} onChange={setView} />
      {view === "gold" && <GoldView />}
      {view === "apartment" && <ApartmentView />}
    </main>
  );
}
