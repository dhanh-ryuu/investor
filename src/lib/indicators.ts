export interface PriceRow {
  date: string;
  buy_price: number;
  sell_price: number;
}

export interface Change {
  absolute: number;
  percentage: number;
}

export interface HighLowPoint {
  value: number;
  date: string;
}

export function calculateMA(
  prices: PriceRow[],
  period: number,
  field: "buy_price" | "sell_price"
): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, row) => acc + row[field], 0);
    return Math.round(sum / period);
  });
}

export function calculateChange(oldValue: number, newValue: number): Change {
  const absolute = newValue - oldValue;
  const percentage = oldValue === 0 ? 0 : (absolute / oldValue) * 100;
  return { absolute, percentage };
}

export function findHighLow(
  prices: PriceRow[],
  field: "buy_price" | "sell_price"
): { high: HighLowPoint; low: HighLowPoint } {
  let high: HighLowPoint = { value: -Infinity, date: "" };
  let low: HighLowPoint = { value: Infinity, date: "" };

  for (const row of prices) {
    if (row[field] > high.value) {
      high = { value: row[field], date: row.date };
    }
    if (row[field] < low.value) {
      low = { value: row[field], date: row.date };
    }
  }

  return { high, low };
}
