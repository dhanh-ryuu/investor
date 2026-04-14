import { PriceRow } from "@/lib/indicators";

interface PriceTableProps {
  prices: PriceRow[];
}

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN");
}

export default function PriceTable({ prices }: PriceTableProps) {
  if (prices.length === 0) return null;

  const reversed = [...prices].reverse();

  return (
    <div className="table-scroll">
      <table className="price-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Buy</th>
            <th>Sell</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {reversed.map((row, i) => {
            const prevRow = reversed[i + 1];
            const change = prevRow ? row.buy_price - prevRow.buy_price : 0;
            const changeClass = change > 0 ? "price-up" : change < 0 ? "price-down" : "";
            return (
              <tr key={row.date}>
                <td>{row.date.slice(5)}</td>
                <td>{formatVND(row.buy_price)}</td>
                <td>{formatVND(row.sell_price)}</td>
                <td className={changeClass}>
                  {change !== 0 ? (<>{change > 0 ? "+" : ""}{formatVND(change)}</>) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
