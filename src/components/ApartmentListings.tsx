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
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return raw;
}

function formatPrice(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + " tỷ";
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

  const areas =
    selectedArea === "all"
      ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
      : [selectedArea];

  const latestDate = prices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const latestPrices = prices.filter((p) => p.date === latestDate && areas.includes(p.area));

  if (latestPrices.length === 0) return null;

  const bedroomTypes = ["1pn", "2pn", "3pn"];

  const groups = areas
    .flatMap((area) =>
      bedroomTypes.map((bt) => {
        const row = latestPrices.find((p) => p.area === area && p.bedroom_type === bt);
        if (!row) return null;
        const listings = parseListings(row.sample_listings);
        if (listings.length === 0) return null;
        const key = `${area}-${bt}`;
        const label =
          selectedArea === "all"
            ? `${AREA_LABELS[area]} · ${bt.toUpperCase()}`
            : bt.toUpperCase();
        return { key, label, listings };
      })
    )
    .filter(Boolean) as { key: string; label: string; listings: ListingSample[] }[];

  if (groups.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">
        Sample Listings · {latestDate}
      </p>

      <div className="border border-[var(--border)] rounded-[var(--radius)] divide-y divide-[var(--border)]">
        {groups.map(({ key, label, listings }) => {
          const isExpanded = expanded === key;
          return (
            <div key={key}>
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <span className="font-medium text-[var(--text)]">
                  {label}
                  <span className="ml-2 text-[var(--text-muted)] font-normal">
                    {listings.length} listing{listings.length !== 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-[var(--text-muted)] text-base leading-none">
                  {isExpanded ? "−" : "+"}
                </span>
              </button>

              {isExpanded && (
                <div className="divide-y divide-[var(--border)]">
                  {listings.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-1 px-4 py-3 hover:bg-[var(--bg-subtle)] transition-colors no-underline"
                    >
                      <span className="text-[13px] text-[#2563eb] truncate">
                        {l.title || "View listing"}
                      </span>
                      <div className="flex gap-4 text-[12px] text-[var(--text-muted)] tabular-nums">
                        <span>{formatPrice(l.price)}</span>
                        <span>{l.areaM2} m²</span>
                        <span>{formatM(l.pricePerM2)}/m²</span>
                        <span className="opacity-60">{l.source}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
