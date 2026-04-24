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
}));

vi.mock("react-chartjs-2", () => ({
  Line: vi.fn(() => <div data-testid="comparison-chart" />),
}));

import GoldComparisonChart from "@/components/GoldComparisonChart";
import type { PriceRow } from "@/lib/indicators";
import type { WorldGoldRow } from "@/lib/world-gold-fetcher";

const sjcPrices: PriceRow[] = [
  { date: "2026-04-01", buy_price: 85_000_000, sell_price: 86_000_000 },
  { date: "2026-04-02", buy_price: 85_500_000, sell_price: 86_500_000 },
];

const worldGold: WorldGoldRow[] = [
  { date: "2026-04-01", asia_vnd: 84_000_000, world_vnd: 84_500_000 },
  { date: "2026-04-02", asia_vnd: 84_200_000, world_vnd: 84_700_000 },
];

describe("GoldComparisonChart", () => {
  beforeEach(() => {
    vi.mocked(Line).mockClear();
  });

  it("renders null when worldGold is empty", () => {
    const { container } = render(
      <GoldComparisonChart sjcPrices={sjcPrices} worldGold={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("SJC line uses borderColor #a78bfa", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    const sjc = props.data.datasets.find((d: { label?: string }) => d.label === "SJC Mua");
    expect(sjc?.borderColor).toBe("#a78bfa");
  });

  it("Asia line uses borderColor #60a5fa", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    const asia = props.data.datasets.find(
      (d: { label?: string }) => d.label === "Châu Á (Asian session)"
    );
    expect(asia?.borderColor).toBe("#60a5fa");
  });

  it("World line uses borderColor #fb923c", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    const world = props.data.datasets.find(
      (d: { label?: string }) => d.label === "Thế giới (NY close)"
    );
    expect(world?.borderColor).toBe("#fb923c");
  });

  it("tooltip background is #141414", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(
      (props.options as { plugins: { tooltip: { backgroundColor: string } } })
        .plugins.tooltip.backgroundColor
    ).toBe("#141414");
  });

  it("grid uses rgba(255, 255, 255, 0.04)", () => {
    render(<GoldComparisonChart sjcPrices={sjcPrices} worldGold={worldGold} />);
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(
      (props.options as { scales: { x: { grid: { color: string } } } }).scales.x.grid.color
    ).toBe("rgba(255, 255, 255, 0.04)");
  });
});
