"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface ListingSample {
  url: string;
  title: string;
  price: number;
  areaM2: number;
  pricePerM2: number;
  source: "nhatot" | "batdongsan";
}

export interface ApartmentPriceRow {
  date: string;
  area: string;
  bedroom_type: string;
  avg_price_per_m2: number;
  min_price_per_m2: number;
  max_price_per_m2: number;
  listing_count: number;
  sample_listings?: string | ListingSample[];
}

interface ApartmentChartProps {
  prices: ApartmentPriceRow[];
  selectedArea: string;
  selectedBedroom: string;
}

const BEDROOM_COLORS: Record<string, string> = {
  "1pn": "#0a0a0a",
  "2pn": "#525252",
  "3pn": "#a3a3a3",
};

const AREA_COLORS: Record<string, string> = {
  ocean_park_1: "#0a0a0a",
  ocean_park_2: "#525252",
  ocean_park_3: "#a3a3a3",
};

const AREA_LABELS: Record<string, string> = {
  ocean_park_1: "OP1",
  ocean_park_2: "OP2",
  ocean_park_3: "OP3",
};

function formatMillions(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function ApartmentChart({ prices, selectedArea, selectedBedroom }: ApartmentChartProps) {
  if (prices.length === 0) return null;

  const dates = [...new Set(prices.map((p) => p.date))].sort();
  const labels = dates.map((d) => d.slice(5));

  let datasets;

  if (selectedArea !== "all") {
    // Single area: show 3 bedroom type lines
    const bedroomTypes = ["1pn", "2pn", "3pn"];
    datasets = bedroomTypes.map((bt) => {
      const filtered = prices.filter((p) => p.area === selectedArea && p.bedroom_type === bt);
      const dataMap = new Map(filtered.map((p) => [p.date, p.avg_price_per_m2]));
      return {
        label: bt.toUpperCase(),
        data: dates.map((d) => dataMap.get(d) ?? null),
        borderColor: BEDROOM_COLORS[bt],
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        fill: false,
      };
    });
  } else {
    // All areas: show 3 area lines for selected bedroom type
    const areas = ["ocean_park_1", "ocean_park_2", "ocean_park_3"];
    datasets = areas.map((area) => {
      const filtered = prices.filter((p) => p.area === area && p.bedroom_type === selectedBedroom);
      const dataMap = new Map(filtered.map((p) => [p.date, p.avg_price_per_m2]));
      return {
        label: AREA_LABELS[area],
        data: dates.map((d) => dataMap.get(d) ?? null),
        borderColor: AREA_COLORS[area],
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        fill: false,
      };
    });
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { color: "#a3a3a3", font: { size: 11 }, boxWidth: 12, padding: 12 },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#0a0a0a",
        bodyColor: "#525252",
        borderColor: "#e5e5e5",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label(ctx) {
            if (ctx.raw === null) return "";
            return `${ctx.dataset.label}: ${formatMillions(ctx.raw as number)}/m²`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#a3a3a3", font: { size: 10 }, maxRotation: 45 },
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      y: {
        ticks: {
          color: "#a3a3a3",
          font: { size: 10 },
          callback: (value) => formatMillions(value as number),
        },
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
    },
  };

  return (
    <div style={{ height: "300px", marginBottom: "12px" }}>
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
}
