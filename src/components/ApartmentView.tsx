"use client";

import { useState, useEffect, useCallback } from "react";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import AreaSelector from "@/components/AreaSelector";
import ApartmentChart, { type ApartmentPriceRow } from "@/components/ApartmentChart";
import ApartmentStatsBar from "@/components/ApartmentStatsBar";
import ApartmentPriceTable from "@/components/ApartmentPriceTable";
import ApartmentListings from "@/components/ApartmentListings";
import Skeleton from "@/components/Skeleton";

const BEDROOM_TYPES = ["1pn", "2pn", "3pn"];

export default function ApartmentView() {
  const [range, setRange] = useState("1m");
  const [area, setArea] = useState("all");
  const [bedroomFilter, setBedroomFilter] = useState("2pn");
  const [prices, setPrices] = useState<ApartmentPriceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async (selectedRange: string, selectedArea: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range: selectedRange });
      if (selectedArea !== "all") params.set("area", selectedArea);
      const res = await fetch(`/api/apartment-prices?${params}`);
      const data: ApartmentPriceRow[] = await res.json();
      setPrices(data);
    } catch (err) {
      console.error("Failed to fetch apartment prices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices(range, area);
  }, [range, area, fetchPrices]);

  return (
    <>
      {/* Section header */}
      <div className="pb-6 mb-6 border-b border-[var(--border)]">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">
          Vinhomes Ocean Park
        </p>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Apartment Prices</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Average price per m²</p>
      </div>

      <AreaSelector selected={area} onChange={setArea} />
      <TimeRangeSelector selected={range} onChange={setRange} />

      {/* Bedroom filter — only shown in "all" mode */}
      {area === "all" && (
        <div className="flex gap-6 border-b border-[var(--border)] mb-4">
          {BEDROOM_TYPES.map((bt) => {
            const isActive = bedroomFilter === bt;
            return (
              <button
                key={bt}
                onClick={() => setBedroomFilter(bt)}
                className={[
                  "pb-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-b-2 border-[var(--text)] text-[var(--text)] -mb-px"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                ].join(" ")}
              >
                {bt.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div>
          <Skeleton className="h-[280px] w-full mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      ) : prices.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            No apartment data yet. Data will appear after the first daily crawl.
          </p>
        </div>
      ) : (
        <>
          <ApartmentChart prices={prices} selectedArea={area} selectedBedroom={bedroomFilter} />
          <ApartmentStatsBar prices={prices} selectedArea={area} />
          <ApartmentPriceTable prices={prices} selectedArea={area} />
          <ApartmentListings prices={prices} selectedArea={area} />
        </>
      )}
    </>
  );
}
