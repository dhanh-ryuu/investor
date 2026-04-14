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

  return (
    <div className="stat-grid" style={{ marginBottom: "12px" }}>
      <div className="stat-item">
        <div className="stat-label">Period High</div>
        <div className="stat-value" style={{ color: "var(--color-red)" }}>{formatVND(high.value)}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{high.date}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Period Low</div>
        <div className="stat-value" style={{ color: "var(--color-green)" }}>{formatVND(low.value)}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{low.date}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Period Change</div>
        <div className={`stat-value ${periodChange.absolute > 0 ? "price-up" : periodChange.absolute < 0 ? "price-down" : ""}`}>
          {periodChange.percentage > 0 ? "+" : ""}{periodChange.percentage.toFixed(2)}%
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Spread</div>
        <div className="stat-value">{formatVND(spread)}</div>
      </div>
    </div>
  );
}
