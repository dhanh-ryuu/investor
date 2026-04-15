import { type ApartmentPriceRow } from "@/components/ApartmentChart";

interface ApartmentStatsBarProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
}

function formatVND(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function ApartmentStatsBar({ prices, selectedArea }: ApartmentStatsBarProps) {
  if (prices.length === 0) return null;

  const bedroomTypes = ["1pn", "2pn", "3pn"];
  const areas =
    selectedArea === "all"
      ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
      : [selectedArea];

  // Get latest date's data
  const latestDate = prices.reduce((max, p) => (p.date > max ? p.date : max), "");
  const latestPrices = prices.filter((p) => p.date === latestDate && areas.includes(p.area));

  // Get data from ~7 days ago for change calculation
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

  return (
    <div className="stat-grid" style={{ marginBottom: "12px" }}>
      {bedroomTypes.map((bt) => {
        const current = latestPrices.filter((p) => p.bedroom_type === bt);
        if (current.length === 0) return null;

        const avgPrice = Math.round(
          current.reduce((sum, p) => sum + p.avg_price_per_m2, 0) / current.length
        );
        const totalListings = current.reduce((sum, p) => sum + p.listing_count, 0);

        // Calculate change
        let changeText = "";
        const oldEntries = current
          .map((c) => oldPricesByType.get(`${c.area}:${c.bedroom_type}`))
          .filter(Boolean);
        if (oldEntries.length > 0) {
          const oldAvg = Math.round(
            oldEntries.reduce((sum, p) => sum + p!.avg_price_per_m2, 0) / oldEntries.length
          );
          const changePct = ((avgPrice - oldAvg) / oldAvg) * 100;
          changeText = `${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%`;
        }

        return (
          <div className="stat-item" key={bt}>
            <div className="stat-label">{bt.toUpperCase()}</div>
            <div className="stat-value">{formatVND(avgPrice)}/m²</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {totalListings} listings
              {changeText && (
                <span
                  className={changeText.startsWith("+") ? "price-up" : "price-down"}
                  style={{ marginLeft: "6px" }}
                >
                  {changeText}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
