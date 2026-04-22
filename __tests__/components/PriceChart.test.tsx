import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Line } from "react-chartjs-2";

vi.mock("chart.js", () => ({
  Chart: { register: vi.fn() },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  Tooltip: class {},
  Legend: class {},
  Filler: class {},
}));

vi.mock("react-chartjs-2", () => ({
  Line: vi.fn(() => <div data-testid="chart" />),
}));

import PriceChart from "@/components/PriceChart";

const prices = Array.from({ length: 10 }, (_, i) => ({
  date: `2026-04-${String(i + 1).padStart(2, "0")}`,
  buy_price: 15000000 + i * 100000,
  sell_price: 15200000 + i * 100000,
}));

describe("PriceChart", () => {
  beforeEach(() => {
    vi.mocked(Line).mockClear();
  });

  it("renders nothing when no prices", () => {
    const { container } = render(<PriceChart prices={[]} visibleStartIndex={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("buy line uses violet border color #a78bfa", () => {
    render(<PriceChart prices={prices} visibleStartIndex={0} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(props.data.datasets[0].borderColor).toBe("#a78bfa");
  });

  it("buy area fill uses semi-transparent violet", () => {
    render(<PriceChart prices={prices} visibleStartIndex={0} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(props.data.datasets[0].backgroundColor).toBe("rgba(167, 139, 250, 0.08)");
  });

  it("tooltip background is dark #141414", () => {
    render(<PriceChart prices={prices} visibleStartIndex={0} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect((props.options as { plugins: { tooltip: { backgroundColor: string } } }).plugins.tooltip.backgroundColor).toBe("#141414");
  });

  it("x-axis grid uses white-on-dark rgba", () => {
    render(<PriceChart prices={prices} visibleStartIndex={0} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect((props.options as { scales: { x: { grid: { color: string } } } }).scales.x.grid.color).toBe("rgba(255, 255, 255, 0.04)");
  });
});
