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
      <div className="py-12 text-center">
        <p className="text-[var(--text-muted)] text-sm">No price data available yet</p>
      </div>
    );
  }

  const latest = prices[prices.length - 1];
  const previous = prices.length > 1 ? prices[prices.length - 2] : null;
  const buyChange = previous ? calculateChange(previous.buy_price, latest.buy_price) : null;
  const isUp = buyChange ? buyChange.absolute > 0 : false;
  const isDown = buyChange ? buyChange.absolute < 0 : false;

  return (
    <div className="pb-10 mb-8 border-b border-[var(--border)]">
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">
        Vàng 9999 · {latest.date}
      </p>

      <div className="text-4xl font-bold tabular-nums mb-3 text-[var(--text)]">
        {formatVND(latest.sell_price)} ₫
      </div>

      {buyChange && (
        <span
          className={[
            "inline-block text-sm font-medium px-3 py-1 rounded-md mb-5",
            isUp
              ? "bg-[rgba(248,113,113,0.1)] text-[var(--red)]"
              : isDown
              ? "bg-[rgba(74,222,128,0.1)] text-[var(--green)]"
              : "bg-[var(--bg-subtle)] text-[var(--text-muted)]",
          ].join(" ")}
        >
          {buyChange.absolute > 0 ? "+" : ""}
          {formatVND(buyChange.absolute)} ({buyChange.percentage > 0 ? "+" : ""}
          {buyChange.percentage.toFixed(2)}%)
        </span>
      )}

      <div className="flex gap-10 text-sm text-[var(--text-secondary)]">
        <div>
          <span className="text-[var(--text-muted)] text-xs uppercase tracking-wide mr-2">Mua</span>
          <span className="font-semibold text-[var(--text)] tabular-nums">
            {formatVND(latest.buy_price)}
          </span>
        </div>
        <div>
          <span className="text-[var(--text-muted)] text-xs uppercase tracking-wide mr-2">Bán</span>
          <span className="font-semibold text-[var(--text)] tabular-nums">
            {formatVND(latest.sell_price)}
          </span>
        </div>
      </div>
    </div>
  );
}
