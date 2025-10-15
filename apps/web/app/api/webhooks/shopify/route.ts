import crypto from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { rateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const webhookLimiter = rateLimit({ windowMs: 60_000, max: 120 });

function safeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const limited = webhookLimiter.check(req);
  if (!limited.ok) {
    return new NextResponse(limited.message ?? "Too many requests", {
      status: 429,
    });
  }

  const h = headers();
  const hmacHeader = h.get("x-shopify-hmac-sha256") ?? "";
  const topic = h.get("x-shopify-topic") ?? "unknown";
  const webhookId = h.get("x-shopify-webhook-id") ?? "";
  const rawBody = await req.text();

  const secret = process.env.SHOPIFY_WEBHOOK_SHARED_SECRET ?? "";
  if (!secret) {
    console.warn("SHOPIFY_WEBHOOK_SHARED_SECRET missing. Rejecting webhook.");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const isValid = safeEqual(
    Buffer.from(digest, "base64"),
    Buffer.from(hmacHeader, "base64"),
  );

  if (!isValid) {
    return new NextResponse("HMAC validation failed", { status: 401 });
  }

  if (!webhookId) {
    return new NextResponse("Missing webhook id", { status: 400 });
  }

  console.info(`Received ${topic} webhook ${webhookId}`);

  // TODO: Write idempotent persistence using Supabase + Drizzle ORM

  return new NextResponse("OK", { status: 200 });
}
