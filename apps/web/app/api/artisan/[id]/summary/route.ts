import { NextResponse } from "next/server";
import { z } from "zod";
import { getArtisanSummary } from "../../../../../lib/queries";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string(),
});

const querySchema = z.object({
  range: z.enum(["1d", "7d", "30d", "90d"]).default("30d"),
});

export async function GET(request: Request, context: { params: { id: string } }) {
  const paramsResult = paramsSchema.safeParse(context.params);
  if (!paramsResult.success) {
    return NextResponse.json({ error: "Invalid artisan id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const queryResult = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!queryResult.success) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const summary = await getArtisanSummary(paramsResult.data.id, queryResult.data.range);
  return NextResponse.json(summary);
}
