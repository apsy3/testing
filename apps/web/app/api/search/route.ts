import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "../../../lib/rate-limit";
import { searchProducts } from "../../../lib/queries";

export const runtime = "nodejs";

const searchLimiter = rateLimit({ windowMs: 60_000, max: 30 });

const filtersSchema = z.object({
  q: z.string().min(1),
  limit: z.string().transform(value => Number.parseInt(value, 10)).optional(),
});

export async function GET(request: Request) {
  const limited = searchLimiter.check(request);
  if (!limited.ok) {
    return NextResponse.json({ error: limited.message ?? "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = filtersSchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const limit = parsed.data.limit && Number.isFinite(parsed.data.limit) ? parsed.data.limit : 24;
  const results = await searchProducts(parsed.data.q, limit);
  return NextResponse.json({ query: parsed.data.q, results });
}
