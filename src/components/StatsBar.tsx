import { PriceRow, calculateChange, findHighLow } from "@/lib/indicators";

interface StatsBarProps {
  prices: PriceRow[];
}

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN");
}

export default function StatsBar({ prices }: StatsBarProps) {
  if (prices.length < 2) return null;

  const first = prices[0];
  const latest = prices[prices.length - 1];
  const { high, low } = findHighLow(prices, "buy_price");
  const periodChange = calculateChange(first.buy_price, latest.buy_price);
  const spread = latest.sell_price - latest.buy_price;

  const stats = [
    {
      label: "Period High",
      value: formatVND(high.value),
      sub: high.date,
      valueClass: "text-[var(--red)]",
    },
    {
      label: "Period Low",
      value: formatVND(low.value),
      sub: low.date,
      valueClass: "text-[var(--green)]",
    },
    {
      label: "Period Change",
      value: `${periodChange.percentage > 0 ? "+" : ""}${periodChange.percentage.toFixed(2)}%`,
      sub: null,
      valueClass:
        periodChange.absolute > 0
          ? "text-[var(--red)]"
          : periodChange.absolute < 0
          ? "text-[var(--green)]"
          : "text-[var(--text)]",
    },
    {
      label: "Spread",
      value: formatVND(spread),
      sub: null,
      valueClass: "text-[var(--text)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {stats.map(({ label, value, sub, valueClass }) => (
        <div
          key={label}
          className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius)] p-4"
        >
          <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className={`text-xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
          {sub && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
        </div>
      ))}
    </div>
  );
}
