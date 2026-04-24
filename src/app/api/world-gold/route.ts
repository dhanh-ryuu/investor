import { NextResponse } from "next/server";
import { fetchWorldGold } from "@/lib/world-gold-fetcher";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  const rows = await fetchWorldGold(30);
  return NextResponse.json(rows);
}
