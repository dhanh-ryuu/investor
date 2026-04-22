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
    <div className="mb-6">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            {["Date", "Buy", "Sell", "Change"].map((h) => (
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
          {reversed.map((row, i) => {
            const prevRow = reversed[i + 1];
            const change = prevRow ? row.buy_price - prevRow.buy_price : 0;
            const changeClass =
              change > 0
                ? "text-[var(--red)]"
                : change < 0
                ? "text-[var(--green)]"
                : "text-[var(--text-muted)]";

            return (
              <tr
                key={row.date}
                className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <td className="py-3 text-[var(--text-secondary)]">{row.date.slice(5)}</td>
                <td className="py-3 text-right tabular-nums font-medium text-[var(--text)]">
                  {formatVND(row.buy_price)}
                </td>
                <td className="py-3 text-right tabular-nums text-[var(--text-secondary)]">
                  {formatVND(row.sell_price)}
                </td>
                <td className={`py-3 text-right tabular-nums font-medium ${changeClass}`}>
                  {change !== 0 ? `${change > 0 ? "+" : ""}${formatVND(change)}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
