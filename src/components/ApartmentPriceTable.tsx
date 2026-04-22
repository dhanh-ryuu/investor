import { type ApartmentPriceRow } from "@/components/ApartmentChart";

interface ApartmentPriceTableProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
}

function formatM(value: number): string {
  return (value / 1_000_000).toFixed(1);
}

export default function ApartmentPriceTable({ prices, selectedArea }: ApartmentPriceTableProps) {
  if (prices.length === 0) return null;

  const areas =
    selectedArea === "all"
      ? ["ocean_park_1", "ocean_park_2", "ocean_park_3"]
      : [selectedArea];

  const filtered = prices.filter((p) => areas.includes(p.area));
  const dates = [...new Set(filtered.map((p) => p.date))].sort().reverse();

  const getAvg = (dayPrices: ApartmentPriceRow[], bt: string): string => {
    const entries = dayPrices.filter((p) => p.bedroom_type === bt);
    if (entries.length === 0) return "—";
    const avg = Math.round(
      entries.reduce((s, p) => s + p.avg_price_per_m2, 0) / entries.length
    );
    return formatM(avg);
  };

  return (
    <div className="mb-6">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            {["Date", "1PN", "2PN", "3PN"].map((h) => (
              <th
                key={h}
                className={`pb-2.5 text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--text)] ${
                  h === "Date" ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const dayPrices = filtered.filter((p) => p.date === date);
            return (
              <tr
                key={date}
                className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <td className="py-3 text-[var(--text-secondary)]">{date.slice(5)}</td>
                <td className="py-3 text-right tabular-nums font-medium text-[var(--text)]">
                  {getAvg(dayPrices, "1pn")}
                </td>
                <td className="py-3 text-right tabular-nums font-medium text-[var(--text)]">
                  {getAvg(dayPrices, "2pn")}
                </td>
                <td className="py-3 text-right tabular-nums font-medium text-[var(--text)]">
                  {getAvg(dayPrices, "3pn")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
