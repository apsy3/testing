import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from './db';
import { hashCustomerEmail, schema } from '@db/index';

const productPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  handle: z.string(),
  body_html: z.string().optional().default(''),
  vendor: z.string().optional().nullable(),
  status: z.string().optional(),
  tags: z.string().optional().default(''),
  updated_at: z.string().optional(),
  created_at: z.string().optional(),
  images: z
    .array(
      z.object({
        src: z.string().url().optional().nullable()
      })
    )
    .optional(),
  image: z.object({ src: z.string().url().optional().nullable() }).optional(),
  variants: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        price: z.string(),
        sku: z.string().optional().nullable()
      })
    )
    .optional()
});

const orderPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  created_at: z.string(),
  financial_status: z.string(),
  current_total_price: z.string(),
  currency: z.string().length(3),
  email: z.string().nullable().optional(),
  source_name: z.string().nullable().optional(),
  line_items: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      product_id: z.union([z.string(), z.number()]).nullable(),
      quantity: z.number(),
      price: z.string(),
      title: z.string().optional()
    })
  )
});

function parsePrice(price: string | undefined) {
  if (!price) return 0;
  return Math.round(parseFloat(price) * 100);
}

async function resolveArtisanId(vendor?: string | null) {
  if (!vendor) return null;
  const [artisan] = await db
    .select({ id: schema.artisans.id })
    .from(schema.artisans)
    .where(eq(schema.artisans.name, vendor))
    .limit(1);
  return artisan?.id ?? null;
}

export async function upsertProduct(payload: unknown) {
  const parsed = productPayloadSchema.parse(payload);
  const shopifyId = String(parsed.id);
  const tags = parsed.tags ? parsed.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  const imageUrl =
    parsed.image?.src ??
    parsed.images?.find(img => Boolean(img.src))?.src ??
    null;
  const variant = parsed.variants?.[0];
  const artisanId = await resolveArtisanId(parsed.vendor ?? undefined);

  await db
    .insert(schema.products)
    .values({
      shopifyId,
      artisanId,
      title: parsed.title,
      slug: parsed.handle,
      description: parsed.body_html ?? '',
      priceCents: parsePrice(variant?.price) || 0,
      currency: 'USD',
      tags,
      status: (parsed.status ?? 'active').toLowerCase() === 'active' ? 'active' : 'draft',
      imageUrl: imageUrl ?? undefined
    })
    .onConflictDoUpdate({
      target: schema.products.shopifyId,
      set: {
        artisanId,
        title: parsed.title,
        slug: parsed.handle,
        description: parsed.body_html ?? '',
        priceCents: parsePrice(variant?.price) || 0,
        tags,
        status: (parsed.status ?? 'active').toLowerCase() === 'active' ? 'active' : 'draft',
        imageUrl: imageUrl ?? undefined,
        updatedAt: new Date()
      }
    });
}

export async function upsertOrder(payload: unknown) {
  const parsed = orderPayloadSchema.parse(payload);
  const shopifyId = String(parsed.id);
  const totalCents = parsePrice(parsed.current_total_price);
  const customerEmailHash = parsed.email ? hashCustomerEmail(parsed.email) : null;

  await db
    .insert(schema.orders)
    .values({
      shopifyId,
      financialStatus: parsed.financial_status,
      totalCents,
      currency: parsed.currency,
      customerEmailHash: customerEmailHash ?? undefined,
      sourceName: parsed.source_name ?? undefined,
      createdAt: new Date(parsed.created_at)
    })
    .onConflictDoUpdate({
      target: schema.orders.shopifyId,
      set: {
        financialStatus: parsed.financial_status,
        totalCents,
        currency: parsed.currency,
        customerEmailHash: customerEmailHash ?? undefined,
        sourceName: parsed.source_name ?? undefined,
        createdAt: new Date(parsed.created_at)
      }
    });

  const [order] = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(eq(schema.orders.shopifyId, shopifyId))
    .limit(1);
  if (!order) return;

  await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));

  for (const item of parsed.line_items) {
    const productShopifyId = item.product_id ? String(item.product_id) : null;
    let productId: string | null = null;
    let artisanId: string | null = null;
    if (productShopifyId) {
      const [product] = await db
        .select({ id: schema.products.id, artisanId: schema.products.artisanId })
        .from(schema.products)
        .where(eq(schema.products.shopifyId, productShopifyId))
        .limit(1);
      if (product) {
        productId = product.id;
        artisanId = product.artisanId;
      }
    }

    await db.insert(schema.orderItems).values({
      orderId: order.id,
      productId: productId ?? undefined,
      artisanId: artisanId ?? undefined,
      shopifyLineItemId: String(item.id),
      quantity: item.quantity,
      unitPriceCents: parsePrice(item.price),
      createdAt: new Date(parsed.created_at)
    });
  }
}

export async function syncShopifyTopic(topic: string, payload: unknown) {
  if (topic.startsWith('products/')) {
    await upsertProduct(payload);
  }

  if (topic.startsWith('orders/')) {
    await upsertOrder(payload);
  }
}
