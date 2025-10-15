import { NextResponse } from "next/server";
import { z } from "zod";
import { getKpiSummary } from "../../../lib/queries";

export const runtime = "nodejs";

const querySchema = z.object({
  range: z.enum(["1d", "7d", "30d", "90d"]).default("7d"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const summary = await getKpiSummary(parsed.data.range);
  return NextResponse.json({
    gmv: summary.gmv,
    aov: summary.aov,
    orders: summary.orders,
    units: summary.units,
    repeatRate: summary.repeatRate,
  });
}
