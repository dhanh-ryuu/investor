import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Header from "@/components/Header";

const samplePrices = [
  { date: "2026-04-21", buy_price: 15300000, sell_price: 15800000 },
  { date: "2026-04-22", buy_price: 15500000, sell_price: 16000000 },
];

describe("Header", () => {
  it("renders empty state when no prices", () => {
    render(<Header prices={[]} />);
    expect(screen.getByText(/no price data/i)).toBeInTheDocument();
  });

  it("renders latest sell price in large text", () => {
    render(<Header prices={samplePrices} />);
    expect(screen.getByText("16.000.000 ₫")).toBeInTheDocument();
  });

  it("shows positive change badge when price increased", () => {
    render(<Header prices={samplePrices} />);
    const badge = screen.getByText(/\+200\.000/);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/text-\[var\(--green\)\]/);
  });

  it("shows buy and sell prices", () => {
    render(<Header prices={samplePrices} />);
    expect(screen.getByText("15.500.000")).toBeInTheDocument();
    expect(screen.getByText("16.000.000")).toBeInTheDocument();
  });
});
