"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { PriceRow, calculateMA, findHighLow } from "@/lib/indicators";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface PriceChartProps {
  prices: PriceRow[];
  visibleStartIndex: number;
}

function formatMillions(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M";
}

export default function PriceChart({ prices, visibleStartIndex }: PriceChartProps) {
  if (prices.length === 0) return null;

  const ma7Buy = calculateMA(prices, 7, "buy_price");
  const ma30Buy = calculateMA(prices, 30, "buy_price");

  const visiblePrices = prices.slice(visibleStartIndex);
  const visibleMA7 = ma7Buy.slice(visibleStartIndex);
  const visibleMA30 = ma30Buy.slice(visibleStartIndex);
  const labels = visiblePrices.map((p) => p.date.slice(5));

  const { high, low } = findHighLow(visiblePrices, "buy_price");
  const buyPointRadius = visiblePrices.map((p) => (p.date === high.date || p.date === low.date ? 6 : 0));
  const buyPointBgColor = visiblePrices.map((p) =>
    p.date === high.date ? "#f87171" : p.date === low.date ? "#4ade80" : "transparent"
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Mua (Buy)",
        data: visiblePrices.map((p) => p.buy_price),
        borderColor: "#0a0a0a",
        backgroundColor: "rgba(10, 10, 10, 0.05)",
        borderWidth: 2,
        pointRadius: buyPointRadius,
        pointBackgroundColor: buyPointBgColor,
        pointBorderColor: buyPointBgColor,
        tension: 0.3,
        fill: false,
      },
      {
        label: "Bán (Sell)",
        data: visiblePrices.map((p) => p.sell_price),
        borderColor: "#737373",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: "MA7",
        data: visibleMA7,
        borderColor: "rgba(10, 10, 10, 0.25)",
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
        borderDash: [],
        fill: false,
      },
      {
        label: "MA30",
        data: visibleMA30,
        borderColor: "rgba(10, 10, 10, 0.12)",
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
        borderDash: [6, 4],
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
            const val = ctx.raw as number;
            return `${ctx.dataset.label}: ${val.toLocaleString("vi-VN")} đ`;
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
      <Line data={data} options={options} />
    </div>
  );
}
