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
import { PriceRow } from "@/lib/indicators";
import { WorldGoldRow } from "@/lib/world-gold-fetcher";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface GoldComparisonChartProps {
  sjcPrices: PriceRow[];
  worldGold: WorldGoldRow[];
}

function formatMillions(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function GoldComparisonChart({
  sjcPrices,
  worldGold,
}: GoldComparisonChartProps) {
  // If worldGold is empty, nothing to render. Empty sjcPrices is handled by the
  // inner-join producing an empty dates array, which triggers the second null guard below.
  if (worldGold.length === 0) return null;

  // Inner join by date
  const sjcByDate = new Map(sjcPrices.map((r) => [r.date, r]));
  const worldByDate = new Map(worldGold.map((r) => [r.date, r]));

  const dates = worldGold
    .map((r) => r.date)
    .filter((d) => sjcByDate.has(d));

  if (dates.length === 0) return null;

  const labels = dates.map((d) => d.slice(5));
  const sjcData = dates.map((d) => sjcByDate.get(d)!.buy_price);
  // dates is derived from worldGold keys, so worldByDate.get(d) is always defined
  const asiaData = dates.map((d) => worldByDate.get(d)!.asia_vnd);
  const worldData = dates.map((d) => worldByDate.get(d)!.world_vnd);

  const data = {
    labels,
    datasets: [
      {
        label: "SJC Mua",
        data: sjcData,
        borderColor: "#a78bfa",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: "Châu Á (Asian session)",
        data: asiaData,
        borderColor: "#60a5fa",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: "Thế giới (NY close)",
        data: worldData,
        borderColor: "#fb923c",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { color: "#444444", font: { size: 11 }, boxWidth: 12, padding: 12 },
      },
      tooltip: {
        backgroundColor: "#141414",
        titleColor: "#e5e5e5",
        bodyColor: "#888888",
        borderColor: "#2a2a2a",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label(ctx) {
            if (ctx.raw === null) return "";
            const val = ctx.raw as number;
            return `${ctx.dataset.label}: ${val.toLocaleString("vi-VN")} đ`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#444444", font: { size: 10 }, maxRotation: 45 },
        grid: { color: "rgba(255, 255, 255, 0.04)" },
      },
      y: {
        ticks: {
          color: "#444444",
          font: { size: 10 },
          callback: (value) => formatMillions(value as number),
        },
        grid: { color: "rgba(255, 255, 255, 0.04)" },
      },
    },
  };

  return (
    <div style={{ height: "300px", marginBottom: "12px" }}>
      <Line data={data} options={options} />
    </div>
  );
}
