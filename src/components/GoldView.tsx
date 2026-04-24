"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import PriceChart from "@/components/PriceChart";
import StatsBar from "@/components/StatsBar";
import PriceTable from "@/components/PriceTable";
import GoldComparisonChart from "@/components/GoldComparisonChart";
import Skeleton from "@/components/Skeleton";
import { PriceRow } from "@/lib/indicators";
import { WorldGoldRow } from "@/lib/world-gold-fetcher";

const RANGE_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
};

export default function GoldView() {
  const [range, setRange] = useState("3m");
  const [allPrices, setAllPrices] = useState<PriceRow[]>([]);
  const [worldGold, setWorldGold] = useState<WorldGoldRow[]>([]);
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

  // World gold fetched once on mount — not tied to range selector
  useEffect(() => {
    fetch("/api/world-gold")
      .then((res) => {
        if (!res.ok) throw new Error(`world-gold fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data: WorldGoldRow[]) => setWorldGold(data))
      .catch((err) => {
        console.error("Failed to fetch world gold:", err);
        setWorldGold([]);
      });
  }, []);

  const visibleStartIndex =
    allPrices.length > RANGE_DAYS[range] ? allPrices.length - RANGE_DAYS[range] : 0;
  const visiblePrices = allPrices.slice(visibleStartIndex);

  if (loading) {
    return (
      <div>
        <div className="pb-8 mb-6 border-b border-[var(--border)]">
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-10 w-56 mb-2" />
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="flex gap-8">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full mb-4" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-3 w-56 mb-4" />
        <Skeleton className="h-[300px] w-full mb-4" />
      </div>
    );
  }

  return (
    <>
      <Header prices={visiblePrices} />
      <TimeRangeSelector selected={range} onChange={setRange} />
      <PriceChart prices={allPrices} visibleStartIndex={visibleStartIndex} />
      <StatsBar prices={visiblePrices} />
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">
        So sánh với giá vàng quốc tế · 30 ngày
      </p>
      <GoldComparisonChart sjcPrices={allPrices} worldGold={worldGold} />
      <PriceTable prices={visiblePrices} />
    </>
  );
}
