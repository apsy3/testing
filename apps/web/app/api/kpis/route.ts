import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    gmvTodayCents: 0,
    ordersToday: 0,
    topProducts: [],
    note: "Replace with Supabase metrics once data sync is connected.",
  });
}
