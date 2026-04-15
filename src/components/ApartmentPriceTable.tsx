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

  return (
    <div className="table-scroll">
      <table className="price-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>1PN</th>
            <th>2PN</th>
            <th>3PN</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const dayPrices = filtered.filter((p) => p.date === date);
            const getAvg = (bt: string) => {
              const entries = dayPrices.filter((p) => p.bedroom_type === bt);
              if (entries.length === 0) return "—";
              const avg = Math.round(
                entries.reduce((s, p) => s + p.avg_price_per_m2, 0) / entries.length
              );
              return formatM(avg);
            };

            return (
              <tr key={date}>
                <td>{date.slice(5)}</td>
                <td>{getAvg("1pn")}</td>
                <td>{getAvg("2pn")}</td>
                <td>{getAvg("3pn")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
