"use client";

import { useState } from "react";
import { type ApartmentPriceRow, type ListingSample } from "@/components/ApartmentChart";

interface ApartmentListingsProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
}

function parseListings(raw: string | ListingSample[] | undefined): ListingSample[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return raw;
}

function formatVND(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + " tỷ";
  }
  return (value / 1_000_000).toFixed(0) + " triệu";
}

function formatM(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

const AREA_LABELS: Record<string, string> = {
  ocean_park_1: "OP1",
  ocean_park_2: "OP2",
  ocean_park_3: "OP3",
};

export default function ApartmentListings({ prices, selectedArea }: ApartmentListingsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const areas = selectedArea === "all"
    ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
    : [selectedArea];

  // Get latest date data
  const latestDate = prices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const latestPrices = prices.filter((p) => p.date === latestDate && areas.includes(p.area));

  if (latestPrices.length === 0) return null;

  const bedroomTypes = ["1pn", "2pn", "3pn"];

  return (
    <div className="card" style={{ padding: "12px" }}>
      <h3 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>
        Listings ({latestDate})
      </h3>
      {areas.map((area) =>
        bedroomTypes.map((bt) => {
          const row = latestPrices.find((p) => p.area === area && p.bedroom_type === bt);
          if (!row) return null;

          const listings = parseListings(row.sample_listings);
          if (listings.length === 0) return null;

          const key = `${area}-${bt}`;
          const isExpanded = expanded === key;
          const label = selectedArea === "all" ? `${AREA_LABELS[area]} - ${bt.toUpperCase()}` : bt.toUpperCase();

          return (
            <div key={key} style={{ marginBottom: "8px" }}>
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                style={{
                  background: "none",
                  border: "1px solid var(--border-color, #333)",
                  color: "var(--text-primary, #e5e5e5)",
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                  height: "auto",
                }}
              >
                <span>{label} ({listings.length} listings)</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                </span>
              </button>

              {isExpanded && (
                <div style={{ marginTop: "4px" }}>
                  {listings.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        padding: "8px 12px",
                        borderBottom: "1px solid rgba(51,51,51,0.5)",
                        textDecoration: "none",
                        color: "inherit",
                        fontSize: "12px",
                      }}
                    >
                      <div style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#60a5fa",
                        marginBottom: "2px",
                      }}>
                        {l.title || "Xem listing"}
                      </div>
                      <div style={{ color: "var(--text-muted)", display: "flex", gap: "12px" }}>
                        <span>{formatVND(l.price)}</span>
                        <span>{l.areaM2}m²</span>
                        <span>{formatM(l.pricePerM2)}/m²</span>
                        <span style={{ opacity: 0.6 }}>{l.source}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
