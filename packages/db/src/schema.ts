import { relations } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  varchar,
  jsonb,
  index
} from 'drizzle-orm/pg-core';

export const profileRoleEnum = pgEnum('profile_role', ['owner', 'staff', 'artisan']);
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'inactive']);

export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey(),
  email: text('email').notNull(),
  role: profileRoleEnum('role').notNull(),
  artisanId: uuid('artisan_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const artisans = pgTable('artisans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  contactEmail: text('contact_email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopifyId: varchar('shopify_id', { length: 64 }).notNull().unique(),
    artisanId: uuid('artisan_id').references(() => artisans.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description').notNull(),
    priceCents: integer('price_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    tags: text('tags').array().default([]).notNull(),
    status: productStatusEnum('status').default('draft').notNull(),
    imageUrl: text('image_url'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  table => ({
    artisanIdx: index('products_artisan_idx').on(table.artisanId)
  })
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopifyId: varchar('shopify_id', { length: 64 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    financialStatus: text('financial_status').notNull(),
    totalCents: integer('total_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    customerEmailHash: varchar('customer_email_hash', { length: 128 }),
    sourceName: text('source_name')
  },
  table => ({
    createdIdx: index('orders_created_idx').on(table.createdAt)
  })
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    shopifyLineItemId: varchar('shopify_line_item_id', { length: 64 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    artisanId: uuid('artisan_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  table => ({
    artisanIdx: index('order_items_artisan_idx').on(table.artisanId)
  })
);

export const processedWebhooks = pgTable('processed_webhooks', {
  id: text('id').primaryKey(),
  topic: text('topic').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  payload: jsonb('payload').notNull()
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  artisan: one(artisans, {
    fields: [profiles.artisanId],
    references: [artisans.id]
  })
}));

export const artisansRelations = relations(artisans, ({ many }) => ({
  products: many(products),
  orderItems: many(orderItems)
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  artisan: one(artisans, {
    fields: [products.artisanId],
    references: [artisans.id]
  }),
  orderItems: many(orderItems)
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  }),
  artisan: one(artisans, {
    fields: [orderItems.artisanId],
    references: [artisans.id]
  })
}));
