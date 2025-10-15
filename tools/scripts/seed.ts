import 'dotenv/config';
import { randomUUID } from 'crypto';
import { getDb, hashCustomerEmail, schema } from '@luxury-heritage/db';

async function main() {
  const db = getDb();

  await db.delete(schema.orderItems);
  await db.delete(schema.orders);
  await db.delete(schema.products);
  await db.delete(schema.artisans);
  await db.delete(schema.profiles);

  const [ownerId, staffId, artisanOneId, artisanTwoId] = [
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID()
  ];

  await db.insert(schema.artisans).values([
    { id: artisanOneId, name: 'Atelier Aurelia', contactEmail: 'aurelia@example.com' },
    { id: artisanTwoId, name: 'Maison Lune', contactEmail: 'lune@example.com' }
  ]);

  await db.insert(schema.profiles).values([
    { userId: ownerId, email: 'owner@example.com', role: 'owner', createdAt: new Date() },
    { userId: staffId, email: 'staff@example.com', role: 'staff', createdAt: new Date() },
    {
      userId: randomUUID(),
      email: 'artisan1@example.com',
      role: 'artisan',
      artisanId: artisanOneId,
      createdAt: new Date()
    },
    {
      userId: randomUUID(),
      email: 'artisan2@example.com',
      role: 'artisan',
      artisanId: artisanTwoId,
      createdAt: new Date()
    }
  ]);

  const productIds: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const artisanId = i % 2 === 0 ? artisanOneId : artisanTwoId;
    const id = randomUUID();
    productIds.push(id);
    await db.insert(schema.products).values({
      id,
      shopifyId: `gid://shopify/Product/${1000 + i}`,
      artisanId,
      title: `Heritage Piece ${i}`,
      slug: `heritage-piece-${i}`,
      description: 'An heirloom-quality piece crafted for the Luxury Heritage collection.',
      priceCents: 45000 + i * 500,
      currency: 'USD',
      tags: ['heritage', i % 2 === 0 ? 'featured' : 'classic'],
      status: 'active',
      imageUrl: `https://picsum.photos/seed/lux-${i}/800/600`
    });
  }

  const ordersToInsert = 20;
  for (let i = 0; i < ordersToInsert; i++) {
    const orderId = randomUUID();
    const productIndex = i % productIds.length;
    const productId = productIds[productIndex];
    const artisanId = productIndex % 2 === 0 ? artisanTwoId : artisanOneId;
    const quantity = (i % 3) + 1;
    const unitPrice = 50000 + productIndex * 700;
    const createdAt = new Date(Date.now() - i * 86400000 / 2);

    await db.insert(schema.orders).values({
      id: orderId,
      shopifyId: `gid://shopify/Order/${5000 + i}`,
      createdAt,
      financialStatus: i % 4 === 0 ? 'pending' : 'paid',
      totalCents: unitPrice * quantity,
      currency: 'USD',
      customerEmailHash: hashCustomerEmail(`customer${i}@example.com`, 'seed-salt'),
      sourceName: 'online-store'
    });

    await db.insert(schema.orderItems).values({
      orderId,
      productId,
      artisanId,
      shopifyLineItemId: `gid://shopify/LineItem/${8000 + i}`,
      quantity,
      unitPriceCents: unitPrice,
      createdAt
    });
  }

  console.log('Seed data inserted successfully.');
}

main().catch(error => {
  console.error('Failed to seed database', error);
  process.exitCode = 1;
});
