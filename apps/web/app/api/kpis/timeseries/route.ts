import { NextResponse } from "next/server";
import { z } from "zod";
import { getKpiTimeseries } from "../../../../lib/queries";

export const runtime = "nodejs";

const querySchema = z.object({
  range: z.enum(["30d", "90d"]).default("90d"),
  granularity: z.enum(["day"]).default("day"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const data = await getKpiTimeseries(parsed.data.range);
  return NextResponse.json({ granularity: parsed.data.granularity, range: parsed.data.range, data });
}
