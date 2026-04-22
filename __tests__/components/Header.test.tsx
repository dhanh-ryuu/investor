import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Header from "@/components/Header";

const samplePrices = [
  { date: "2026-04-21", buy_price: 15300000, sell_price: 15800000 },
  { date: "2026-04-22", buy_price: 15500000, sell_price: 16000000 },
];

const fallingPrices = [
  { date: "2026-04-21", buy_price: 15500000, sell_price: 16000000 },
  { date: "2026-04-22", buy_price: 15300000, sell_price: 15800000 },
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

  it("shows red badge when price increased (VN convention: tăng = đỏ)", () => {
    render(<Header prices={samplePrices} />);
    const badge = screen.getByText(/\+200\.000/);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/text-\[var\(--red\)\]/);
  });

  it("shows green badge when price decreased (VN convention: giảm = xanh)", () => {
    render(<Header prices={fallingPrices} />);
    const badge = screen.getByText(/-200\.000/);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/text-\[var\(--green\)\]/);
  });

  it("shows buy and sell prices", () => {
    render(<Header prices={samplePrices} />);
    expect(screen.getByText("15.500.000")).toBeInTheDocument();
    expect(screen.getByText("16.000.000")).toBeInTheDocument();
  });
});
