import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PriceTable from "@/components/PriceTable";

const prices = [
  { date: "2026-04-20", buy_price: 15400000, sell_price: 15600000 },
  { date: "2026-04-21", buy_price: 15300000, sell_price: 15500000 },
  { date: "2026-04-22", buy_price: 15500000, sell_price: 15700000 },
];

describe("PriceTable", () => {
  it("renders null when no prices", () => {
    const { container } = render(<PriceTable prices={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders header columns", () => {
    render(<PriceTable prices={prices} />);
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByText("Sell")).toBeInTheDocument();
    expect(screen.getByText("Change")).toBeInTheDocument();
  });

  it("thead uses text-secondary border not text border", () => {
    render(<PriceTable prices={prices} />);
    const dateHeader = screen.getByText("Date");
    expect(dateHeader.className).toMatch(/border-\[var\(--text-secondary\)\]/);
    expect(dateHeader.className).not.toMatch(/border-\[var\(--text\)\]/);
  });

  it("shows rows in reverse chronological order", () => {
    render(<PriceTable prices={prices} />);
    const cells = screen.getAllByText(/04-\d{2}/);
    expect(cells[0].textContent).toBe("04-22");
  });
});
