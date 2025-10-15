import { NextResponse } from "next/server";
import { rateLimit } from "../../../lib/rate-limit";

export const runtime = "nodejs";

const searchLimiter = rateLimit({ windowMs: 60_000, max: 30 });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  const limited = searchLimiter.check(request);
  if (!limited.ok) {
    return new NextResponse(limited.message ?? "Too many requests", {
      status: 429,
    });
  }

  if (!query) {
    return NextResponse.json({ query, results: [] });
  }

  const results = [
    {
      id: "ring-gilded-aurora",
      title: "Gilded Aurora Ring",
      slug: "ring-gilded-aurora",
      priceCents: 125000,
      currency: "USD",
      imageUrl:
        "https://cdn.shopify.com/static/sample-images/golden-wristwatch.jpg",
    },
  ];

  return NextResponse.json({ query, results });
}
