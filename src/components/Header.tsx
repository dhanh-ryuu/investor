import { PriceRow, calculateChange } from "@/lib/indicators";

interface HeaderProps {
  prices: PriceRow[];
}

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN");
}

export default function Header({ prices }: HeaderProps) {
  if (prices.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "24px" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Gold Price Tracker</h1>
        <p style={{ color: "var(--text-muted)" }}>No price data available yet</p>
      </div>
    );
  }

  const latest = prices[prices.length - 1];
  const previous = prices.length > 1 ? prices[prices.length - 2] : null;
  const buyChange = previous ? calculateChange(previous.buy_price, latest.buy_price) : null;

  return (
    <div className="card">
      <h1 style={{ fontSize: "18px", color: "var(--text-muted)", marginBottom: "12px" }}>
        Gold Price Tracker
      </h1>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
        Vàng 9999 — {latest.date}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>MUA</div>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>{formatVND(latest.buy_price)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>BÁN</div>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>{formatVND(latest.sell_price)}</div>
        </div>
      </div>
      {buyChange && (
        <div
          style={{ marginTop: "8px", fontSize: "14px", fontWeight: 500 }}
          className={buyChange.absolute > 0 ? "price-up" : buyChange.absolute < 0 ? "price-down" : ""}
        >
          {buyChange.absolute > 0 ? "+" : ""}{formatVND(buyChange.absolute)} ({buyChange.percentage > 0 ? "+" : ""}{buyChange.percentage.toFixed(2)}%)
        </div>
      )}
    </div>
  );
}
