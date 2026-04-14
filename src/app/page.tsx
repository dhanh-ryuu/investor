"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import PriceChart from "@/components/PriceChart";
import StatsBar from "@/components/StatsBar";
import PriceTable from "@/components/PriceTable";
import { PriceRow } from "@/lib/indicators";

const RANGE_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
};

export default function Home() {
  const [range, setRange] = useState("3m");
  const [allPrices, setAllPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prices?range=${selectedRange}`);
      const data: PriceRow[] = await res.json();
      setAllPrices(data);
    } catch (err) {
      console.error("Failed to fetch prices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices(range);
  }, [range, fetchPrices]);

  const visibleStartIndex =
    allPrices.length > RANGE_DAYS[range]
      ? allPrices.length - RANGE_DAYS[range]
      : 0;

  const visiblePrices = allPrices.slice(visibleStartIndex);

  const handleRangeChange = (newRange: string) => {
    setRange(newRange);
  };

  return (
    <main>
      <Header prices={visiblePrices} />
      <TimeRangeSelector selected={range} onChange={handleRangeChange} />
      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        </div>
      ) : (
        <>
          <PriceChart prices={allPrices} visibleStartIndex={visibleStartIndex} />
          <StatsBar prices={visiblePrices} />
          <PriceTable prices={visiblePrices} />
        </>
      )}
    </main>
  );
}
