import { describe, it, expect } from "vitest";
import { parseStooqCsv, convertToVnd } from "@/lib/world-gold-fetcher";

describe("parseStooqCsv", () => {
  it("parses header + 2 data rows correctly", () => {
    const csv = `Date,Open,High,Low,Close,Volume
2026-04-24,3320.10,3340.50,3310.20,3330.00,0
2026-04-23,3300.00,3325.00,3295.00,3315.50,0`;
    const result = parseStooqCsv(csv);
    expect(result.size).toBe(2);
    expect(result.get("2026-04-24")).toEqual({ open: 3320.1, close: 3330.0 });
    expect(result.get("2026-04-23")).toEqual({ open: 3300.0, close: 3315.5 });
  });

  it("skips rows with non-numeric values", () => {
    const csv = `Date,Open,High,Low,Close,Volume
2026-04-24,N/A,N/A,N/A,N/A,0
2026-04-23,3300.00,3325.00,3295.00,3315.50,0`;
    const result = parseStooqCsv(csv);
    expect(result.size).toBe(1);
    expect(result.has("2026-04-24")).toBe(false);
  });

  it("returns empty map for header-only CSV", () => {
    expect(parseStooqCsv("Date,Open,High,Low,Close,Volume").size).toBe(0);
  });

  it("returns empty map for empty string", () => {
    expect(parseStooqCsv("").size).toBe(0);
  });
});

describe("convertToVnd", () => {
  it("converts open and close USD/oz to VND/lượng", () => {
    const result = convertToVnd(3000, 3100, 25000);
    expect(result.asia_vnd).toBe(90423907);
    expect(result.world_vnd).toBe(93438038);
  });

  it("returns integer values (Math.round)", () => {
    const result = convertToVnd(3333.33, 3444.44, 25123);
    expect(Number.isInteger(result.asia_vnd)).toBe(true);
    expect(Number.isInteger(result.world_vnd)).toBe(true);
  });
});
