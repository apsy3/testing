import { cache } from 'react';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { schema } from '@db/index';

type Range = '1d' | '7d' | '30d' | '90d';

type CatalogParams = {
  search?: string;
  artisanIds?: string[];
  sort?: 'newest' | 'price-asc' | 'price-desc';
};

function resolveRangeStart(range: Range) {
  const days = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  return start;
}

export const getFeaturedProducts = cache(async (limit = 4) => {
  const products = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.status, 'active'))
    .orderBy(desc(schema.products.createdAt))
    .limit(limit);
  return products;
});

export const listArtisans = cache(async () => {
  return db.select().from(schema.artisans).orderBy(desc(schema.artisans.createdAt));
});

export const getCatalogProducts = cache(async (params: CatalogParams = {}) => {
  const { search, artisanIds, sort = 'newest' } = params;
  const conditions = [eq(schema.products.status, 'active')];
  if (artisanIds?.length) {
    conditions.push(inArray(schema.products.artisanId, artisanIds));
  }
  const orderBy =
    sort === 'price-asc'
      ? schema.products.priceCents.asc()
      : sort === 'price-desc'
        ? schema.products.priceCents.desc()
        : desc(schema.products.createdAt);

  if (search) {
    const statement = await db.execute(
      sql`select p.*, ts_rank_cd(to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.description, '')), plainto_tsquery(${search})) as rank from products p where p.status = 'active' order by rank desc limit 48`
    );
    const rows = statement.rows as Array<typeof schema.products.$inferSelect & { artisan_id: string | null }>;
    if (artisanIds?.length) {
      return rows.filter(row => row.artisan_id && artisanIds.includes(row.artisan_id));
    }
    return rows;
  }

  const filter = conditions.length > 1 ? and(...conditions) : conditions[0]!;

  const query = db
    .select()
    .from(schema.products)
    .where(filter)
    .orderBy(orderBy)
    .limit(48);
  return await query;
});

export const getProductBySlug = cache(async (slug: string) => {
  const [product] = await db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.slug, slug), eq(schema.products.status, 'active')))
    .limit(1);
  return product ?? null;
});

export const getKpiSummary = cache(async (range: Range) => {
  const start = resolveRangeStart(range);
  const totalsResult = await db.execute(sql`
    select
      coalesce(sum(o.total_cents), 0) as gmv,
      count(distinct o.id) as orders
    from orders o
    where o.created_at >= ${start}
  `);
  const unitsResult = await db.execute(sql`
    select coalesce(sum(oi.quantity), 0) as units
    from order_items oi
    where oi.created_at >= ${start}
  `);

  const gmv = Number(totalsResult.rows[0]?.gmv ?? 0);
  const orders = Number(totalsResult.rows[0]?.orders ?? 0);
  const units = Number(unitsResult.rows[0]?.units ?? 0);

  const repeatResult = await db.execute(sql`
    select coalesce(avg(case when order_count > 1 then 1 else 0 end), 0) as repeat_rate
    from (
      select customer_email_hash, count(*) as order_count
      from orders
      where customer_email_hash is not null and created_at >= ${start}
      group by customer_email_hash
    ) as customer_stats
  `);
  const repeatRate = Number(repeatResult.rows[0]?.repeat_rate ?? 0);

  const aov = orders > 0 ? gmv / orders : 0;

  return { gmv, orders, units, aov, repeatRate };
});

export const getKpiTimeseries = cache(async (range: Range) => {
  const start = resolveRangeStart(range);
  const result = await db.execute(sql`
    select date_trunc('day', o.created_at) as bucket,
      sum(o.total_cents) as gmv,
      count(distinct o.id) as orders
    from orders o
    where o.created_at >= ${start}
    group by bucket
    order by bucket asc
  `);

  return result.rows.map(row => ({
    date: new Date(row.bucket as string).toISOString().slice(0, 10),
    gmv: Number(row.gmv ?? 0),
    orders: Number(row.orders ?? 0)
  }));
});

export const getArtisanSummary = cache(async (artisanId: string, range: Range) => {
  const start = resolveRangeStart(range);
  const [summary] = await db
    .select({
      sales: sql<number>`coalesce(sum(${schema.orderItems.unitPriceCents} * ${schema.orderItems.quantity}), 0)`,
      units: sql<number>`coalesce(sum(${schema.orderItems.quantity}), 0)`,
      orders: sql<number>`count(distinct ${schema.orderItems.orderId})`
    })
    .from(schema.orderItems)
    .where(and(eq(schema.orderItems.artisanId, artisanId), gte(schema.orderItems.createdAt, start)));

  const payoutsDue = Number(summary?.sales ?? 0) * 0.7;

  const topProductsResult = await db.execute(sql`
    select p.id, p.title, p.slug, sum(oi.quantity) as units, sum(oi.unit_price_cents * oi.quantity) as revenue
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.artisan_id = ${artisanId} and oi.created_at >= ${start}
    group by p.id, p.title, p.slug
    order by revenue desc
    limit 5
  `);

  return {
    sales: Number(summary?.sales ?? 0),
    units: Number(summary?.units ?? 0),
    payoutsDue: Number.isFinite(payoutsDue) ? Math.round(payoutsDue) : 0,
    orders: Number(summary?.orders ?? 0),
    topProducts: topProductsResult.rows.map(row => ({
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      units: Number(row.units ?? 0),
      revenue: Number(row.revenue ?? 0)
    }))
  };
});

export const searchProducts = cache(async (query: string, limit = 24) => {
  const result = await db.execute(sql`
    select p.id, p.title, p.slug, p.price_cents, p.currency, p.image_url,
      ts_rank_cd(to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.description, '')), plainto_tsquery(${query})) as rank
    from products p
    where p.status = 'active'
      and to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.description, '')) @@ plainto_tsquery(${query})
    order by rank desc
    limit ${limit}
  `);

  return result.rows.map(row => ({
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    priceCents: Number(row.price_cents ?? 0),
    currency: row.currency as string,
    imageUrl: row.image_url as string | null
  }));
});

export const getDashboardOverview = cache(async () => {
  const summary = await getKpiSummary('30d');
  const timeseries = await getKpiTimeseries('30d');
  const topProducts = await db.execute(sql`
    select p.id, p.title, sum(oi.quantity) as units
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.created_at >= ${resolveRangeStart('30d')}
    group by p.id, p.title
    order by units desc
    limit 5
  `);

  return {
    summary,
    timeseries,
    topProducts: topProducts.rows.map(row => ({
      id: row.id as string,
      title: row.title as string,
      units: Number(row.units ?? 0)
    }))
  };
});
