import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ApartmentListings from "@/components/ApartmentListings";
import { type ApartmentPriceRow } from "@/components/ApartmentChart";

const sampleListings = JSON.stringify([
  {
    url: "https://example.com/1",
    title: "Căn hộ 2PN Ocean Park 1",
    price: 2500000000,
    areaM2: 65,
    pricePerM2: 38461538,
    source: "nhatot",
  },
]);

const samplePrices: ApartmentPriceRow[] = [
  {
    date: "2026-04-22",
    area: "ocean_park_1",
    bedroom_type: "2pn",
    avg_price_per_m2: 38000000,
    min_price_per_m2: 35000000,
    max_price_per_m2: 42000000,
    listing_count: 1,
    sample_listings: sampleListings,
  },
];

describe("ApartmentListings", () => {
  it("renders accordion button with listing count", () => {
    render(<ApartmentListings prices={samplePrices} selectedArea="ocean_park_1" />);
    expect(screen.getByText(/1 listing/)).toBeInTheDocument();
  });

  it("listings are hidden by default", () => {
    render(<ApartmentListings prices={samplePrices} selectedArea="ocean_park_1" />);
    expect(screen.queryByText("Căn hộ 2PN Ocean Park 1")).not.toBeInTheDocument();
  });

  it("expands listings on button click", () => {
    render(<ApartmentListings prices={samplePrices} selectedArea="ocean_park_1" />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Căn hộ 2PN Ocean Park 1")).toBeInTheDocument();
  });

  it("collapses listings on second click", () => {
    render(<ApartmentListings prices={samplePrices} selectedArea="ocean_park_1" />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByText("Căn hộ 2PN Ocean Park 1")).not.toBeInTheDocument();
  });
});
