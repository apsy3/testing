import 'dotenv/config';
import { createHmac } from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@luxury-heritage/db';

const db = getDb();

async function main() {
  const [webhookId, targetUrl] = process.argv.slice(2);
  if (!webhookId) {
    throw new Error(
      'Usage: node .yarn/releases/yarn-4.4.1.cjs run -w tools/scripts webhook:replay <webhook-id> [target-url]'
    );
  }

  const [record] = await db
    .select()
    .from(schema.processedWebhooks)
    .where(eq(schema.processedWebhooks.id, webhookId))
    .limit(1);

  if (!record) {
    throw new Error(`Webhook ${webhookId} not found`);
  }

  const secret = process.env.SHOPIFY_WEBHOOK_SHARED_SECRET;
  if (!secret) {
    throw new Error('SHOPIFY_WEBHOOK_SHARED_SECRET must be configured');
  }

  const url = targetUrl ?? `${process.env.APP_URL ?? 'http://localhost:3000'}/api/webhooks/shopify`;
  const payload = JSON.stringify(record.payload);
  const signature = createHmac('sha256', secret).update(payload, 'utf8').digest('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Topic': record.topic,
      'X-Shopify-Webhook-Id': record.id,
      'X-Shopify-Hmac-Sha256': signature
    },
    body: payload
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Replay failed (${response.status}): ${text}`);
  }

  console.log(`Webhook ${webhookId} replayed to ${url}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
