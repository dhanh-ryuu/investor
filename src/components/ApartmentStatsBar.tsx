import { type ApartmentPriceRow } from "@/components/ApartmentChart";

interface ApartmentStatsBarProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
}

function formatM(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function ApartmentStatsBar({ prices, selectedArea }: ApartmentStatsBarProps) {
  if (prices.length === 0) return null;

  const bedroomTypes = ["1pn", "2pn", "3pn"];
  const areas =
    selectedArea === "all"
      ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
      : [selectedArea];

  const latestDate = prices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const latestPrices = prices.filter((p) => p.date === latestDate && areas.includes(p.area));

  const weekAgo = new Date(latestDate);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  const oldPrices = prices.filter((p) => p.date <= weekAgoStr && areas.includes(p.area));
  const oldestRelevant = oldPrices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const oldPricesByType = new Map(
    oldPrices
      .filter((p) => p.date === oldestRelevant)
      .map((p) => [`${p.area}:${p.bedroom_type}`, p])
  );

  const cards = bedroomTypes
    .map((bt) => {
      const current = latestPrices.filter((p) => p.bedroom_type === bt);
      if (current.length === 0) return null;

      const avgPrice = Math.round(
        current.reduce((sum, p) => sum + p.avg_price_per_m2, 0) / current.length
      );
      const totalListings = current.reduce((sum, p) => sum + p.listing_count, 0);

      let changePct: number | null = null;
      const oldEntries = current
        .map((c) => oldPricesByType.get(`${c.area}:${c.bedroom_type}`))
        .filter(Boolean);
      if (oldEntries.length > 0) {
        const oldAvg = Math.round(
          oldEntries.reduce((sum, p) => sum + p!.avg_price_per_m2, 0) / oldEntries.length
        );
        changePct = ((avgPrice - oldAvg) / oldAvg) * 100;
      }

      return { bt, avgPrice, totalListings, changePct };
    })
    .filter(Boolean) as { bt: string; avgPrice: number; totalListings: number; changePct: number | null }[];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {cards.map(({ bt, avgPrice, totalListings, changePct }) => (
        <div
          key={bt}
          className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius)] p-4"
        >
          <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">
            {bt}
          </p>
          <p className="text-xl font-semibold tabular-nums text-[var(--text)]">
            {formatM(avgPrice)}/m²
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {totalListings} listings
            {changePct !== null && (
              <span
                className={`ml-1.5 font-medium ${
                  changePct > 0 ? "text-[var(--red)]" : "text-[var(--green)]"
                }`}
              >
                {changePct > 0 ? "+" : ""}
                {changePct.toFixed(1)}%
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
