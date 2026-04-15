"use client";

import { useState, useEffect, useCallback } from "react";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import AreaSelector from "@/components/AreaSelector";
import ApartmentChart, { type ApartmentPriceRow } from "@/components/ApartmentChart";
import ApartmentStatsBar from "@/components/ApartmentStatsBar";
import ApartmentPriceTable from "@/components/ApartmentPriceTable";
import ApartmentListings from "@/components/ApartmentListings";

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
      <div className="card">
        <h1 style={{ fontSize: "18px", color: "var(--text-muted)", marginBottom: "4px" }}>
          Apartment Price Tracker
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Vinhomes Ocean Park — Avg price per m²
        </p>
      </div>

      <AreaSelector selected={area} onChange={setArea} />
      <TimeRangeSelector selected={range} onChange={setRange} />

      {area === "all" && (
        <div className="pill-group" style={{ marginTop: "-8px" }}>
          {BEDROOM_TYPES.map((bt) => (
            <button
              key={bt}
              className={`pill ${bedroomFilter === bt ? "active" : ""}`}
              onClick={() => setBedroomFilter(bt)}
              style={{ fontSize: "12px", padding: "4px 14px" }}
            >
              {bt.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        </div>
      ) : prices.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>
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
