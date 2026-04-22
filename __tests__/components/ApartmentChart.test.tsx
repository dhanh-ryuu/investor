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
  Line: vi.fn(() => <div data-testid="apartment-chart" />),
}));

import ApartmentChart from "@/components/ApartmentChart";
import type { ApartmentPriceRow } from "@/components/ApartmentChart";

const makeRow = (date: string, area: string, bedroom_type: string): ApartmentPriceRow => ({
  date,
  area,
  bedroom_type,
  avg_price_per_m2: 50000000,
  min_price_per_m2: 45000000,
  max_price_per_m2: 55000000,
  listing_count: 10,
});

const prices: ApartmentPriceRow[] = [
  makeRow("2026-04-01", "ocean_park_1", "1pn"),
  makeRow("2026-04-01", "ocean_park_1", "2pn"),
  makeRow("2026-04-01", "ocean_park_1", "3pn"),
  makeRow("2026-04-02", "ocean_park_1", "1pn"),
  makeRow("2026-04-02", "ocean_park_1", "2pn"),
  makeRow("2026-04-02", "ocean_park_1", "3pn"),
];

describe("ApartmentChart", () => {
  beforeEach(() => {
    vi.mocked(Line).mockClear();
  });

  it("renders nothing when no prices", () => {
    const { container } = render(
      <ApartmentChart prices={[]} selectedArea="ocean_park_1" selectedBedroom="1pn" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("1pn line uses primary violet #a78bfa", () => {
    render(
      <ApartmentChart prices={prices} selectedArea="ocean_park_1" selectedBedroom="1pn" />
    );
    const [props] = vi.mocked(Line).mock.calls[0];
    const onePnDataset = props.data.datasets.find((d: { label: string }) => d.label === "1PN");
    expect(onePnDataset?.borderColor).toBe("#a78bfa");
  });

  it("tooltip background is dark #141414", () => {
    render(
      <ApartmentChart prices={prices} selectedArea="ocean_park_1" selectedBedroom="1pn" />
    );
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(
      (props.options as { plugins: { tooltip: { backgroundColor: string } } }).plugins.tooltip
        .backgroundColor
    ).toBe("#141414");
  });

  it("grid uses white-on-dark rgba", () => {
    render(
      <ApartmentChart prices={prices} selectedArea="ocean_park_1" selectedBedroom="1pn" />
    );
    const [props] = vi.mocked(Line).mock.calls[0];
    expect(
      (props.options as { scales: { x: { grid: { color: string } } } }).scales.x.grid.color
    ).toBe("rgba(255, 255, 255, 0.04)");
  });
});
