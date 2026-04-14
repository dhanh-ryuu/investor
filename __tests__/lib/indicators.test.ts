import { describe, it, expect } from "vitest";
import { calculateMA, calculateChange, findHighLow } from "@/lib/indicators";

const samplePrices = [
  { date: "2026-01-01", buy_price: 15000000, sell_price: 15500000 },
  { date: "2026-01-02", buy_price: 15100000, sell_price: 15600000 },
  { date: "2026-01-03", buy_price: 15200000, sell_price: 15700000 },
  { date: "2026-01-04", buy_price: 15050000, sell_price: 15550000 },
  { date: "2026-01-05", buy_price: 14900000, sell_price: 15400000 },
  { date: "2026-01-06", buy_price: 15300000, sell_price: 15800000 },
  { date: "2026-01-07", buy_price: 15250000, sell_price: 15750000 },
  { date: "2026-01-08", buy_price: 15400000, sell_price: 15900000 },
];

describe("calculateMA", () => {
  it("calculates 3-day moving average for buy_price", () => {
    const ma = calculateMA(samplePrices, 3, "buy_price");
    expect(ma[0]).toBeNull();
    expect(ma[1]).toBeNull();
    expect(ma[2]).toBe(15100000);
    expect(ma[3]).toBeCloseTo(15116667, -1);
  });

  it("returns all nulls when period exceeds data length", () => {
    const ma = calculateMA(samplePrices.slice(0, 2), 7, "buy_price");
    expect(ma.every((v: number | null) => v === null)).toBe(true);
  });
});

describe("calculateChange", () => {
  it("calculates absolute and percentage change", () => {
    const change = calculateChange(15000000, 15300000);
    expect(change.absolute).toBe(300000);
    expect(change.percentage).toBeCloseTo(2.0, 1);
  });

  it("handles negative change", () => {
    const change = calculateChange(15300000, 15000000);
    expect(change.absolute).toBe(-300000);
    expect(change.percentage).toBeCloseTo(-1.96, 1);
  });

  it("handles zero base", () => {
    const change = calculateChange(0, 15000000);
    expect(change.absolute).toBe(15000000);
    expect(change.percentage).toBe(0);
  });
});

describe("findHighLow", () => {
  it("finds highest and lowest buy prices with dates", () => {
    const { high, low } = findHighLow(samplePrices, "buy_price");
    expect(high.value).toBe(15400000);
    expect(high.date).toBe("2026-01-08");
    expect(low.value).toBe(14900000);
    expect(low.date).toBe("2026-01-05");
  });

  it("works with sell_price", () => {
    const { high, low } = findHighLow(samplePrices, "sell_price");
    expect(high.value).toBe(15900000);
    expect(low.value).toBe(15400000);
  });
});
