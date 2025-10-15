import { createHmac, timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { schema } from "@db/index";
import { eq } from "drizzle-orm";
import { rateLimit } from "../../../../lib/rate-limit";
import { db } from "../../../../lib/db";
import { syncShopifyTopic } from "../../../../lib/shopify-webhook";

export const runtime = "nodejs";

const webhookLimiter = rateLimit({ windowMs: 60_000, max: 60 });

function safeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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
    console.error("SHOPIFY_WEBHOOK_SHARED_SECRET missing. Rejecting webhook.");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const isValid = safeEqual(Buffer.from(digest, "base64"), Buffer.from(hmacHeader, "base64"));

  if (!isValid) {
    return new NextResponse("HMAC validation failed", { status: 401 });
  }

  if (!webhookId) {
    return new NextResponse("Missing webhook id", { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error("Webhook payload parsing failed", { topic, webhookId });
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const [existing] = await db
    .select({ id: schema.processedWebhooks.id })
    .from(schema.processedWebhooks)
    .where(eq(schema.processedWebhooks.id, webhookId))
    .limit(1);

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await db
    .insert(schema.processedWebhooks)
    .values({ id: webhookId, topic, payload });

  await syncShopifyTopic(topic, payload);

  return NextResponse.json({ ok: true });
}
