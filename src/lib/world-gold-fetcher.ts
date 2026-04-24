export interface WorldGoldRow {
  date: string;      // "2026-04-24"
  asia_vnd: number;  // VND per lượng — Asian session (daily open price)
  world_vnd: number; // VND per lượng — NY/global close
}

const OZ_PER_LUONG = 37.5 / 31.1035;

const XAU_URL = "https://stooq.com/q/d/l/?s=xauusd&i=d";
const VND_URL = "https://stooq.com/q/d/l/?s=usdvnd&i=d";

export function parseStooqCsv(csv: string): Map<string, { open: number; close: number }> {
  const result = new Map<string, { open: number; close: number }>();
  const lines = csv.trim().split("\n");
  // lines[0] is the header — skip it
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;
    const date = parts[0].trim();
    const open = parseFloat(parts[1]);
    const close = parseFloat(parts[4]);
    if (!isFinite(open) || !isFinite(close)) continue;
    result.set(date, { open, close });
  }
  return result;
}

export function convertToVnd(
  openUsd: number,
  closeUsd: number,
  usdVnd: number
): { asia_vnd: number; world_vnd: number } {
  return {
    asia_vnd: Math.round(openUsd * OZ_PER_LUONG * usdVnd),
    world_vnd: Math.round(closeUsd * OZ_PER_LUONG * usdVnd),
  };
}

export async function fetchWorldGold(days: number): Promise<WorldGoldRow[]> {
  try {
    const [xauRes, vndRes] = await Promise.all([
      fetch(XAU_URL, { signal: AbortSignal.timeout(5000) }),
      fetch(VND_URL, { signal: AbortSignal.timeout(5000) }),
    ]);
    if (!xauRes.ok || !vndRes.ok) return [];

    const [xauCsv, vndCsv] = await Promise.all([
      xauRes.text(),
      vndRes.text(),
    ]);

    const xauMap = parseStooqCsv(xauCsv);
    const vndMap = parseStooqCsv(vndCsv);

    const rows: WorldGoldRow[] = [];
    for (const [date, xau] of xauMap) {
      const vnd = vndMap.get(date);
      if (!vnd) continue; // skip dates with no VND rate (holiday mismatch)
      const { asia_vnd, world_vnd } = convertToVnd(xau.open, xau.close, vnd.close);
      rows.push({ date, asia_vnd, world_vnd });
    }

    // stooq returns newest-first; sort ascending then take last `days`
    rows.sort((a, b) => a.date.localeCompare(b.date));
    if (days <= 0) return [];
    return rows.slice(-days);
  } catch {
    return [];
  }
}
