import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getArtisanSummary, listArtisans } from "../../lib/queries";
import styles from "../styles/artisan.module.scss";

export const metadata = {
  title: "Artisan Dashboard",
};

interface ArtisanPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function formatCurrency(value: number, currency = "USD") {
  return (value / 100).toLocaleString("en-US", { style: "currency", currency });
}

export default async function ArtisanPage({ searchParams }: ArtisanPageProps) {
  const artisans = await listArtisans();
  if (artisans.length === 0) {
    notFound();
  }

  const schema = z.object({ id: z.string().optional() });
  const parsed = schema.safeParse(searchParams ?? {});
  const selectedId = parsed.success && parsed.data.id ? parsed.data.id : artisans[0]!.id;
  const selectedArtisan = artisans.find(item => item.id === selectedId) ?? artisans[0]!;
  if (!selectedArtisan?.id) {
    notFound();
  }

  const [summaryToday, summary7, summary30] = await Promise.all([
    getArtisanSummary(selectedArtisan.id!, "1d"),
    getArtisanSummary(selectedArtisan.id!, "7d"),
    getArtisanSummary(selectedArtisan.id!, "30d"),
  ]);

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <h2>Artisans</h2>
        <ul>
          {artisans.map(artisan => (
            <li key={artisan.id} className={artisan.id === selectedArtisan.id ? styles.active : undefined}>
              <Link href={`/artisan?id=${artisan.id}`}>{artisan.name}</Link>
            </li>
          ))}
        </ul>
      </aside>
      <section className={styles.content}>
        <header>
          <h1>{selectedArtisan.name}</h1>
          <p>Track payouts, fulfillment queues, and sales velocity.</p>
        </header>
        <div className={styles.metrics}>
          <article>
            <h3>Today</h3>
            <p>{formatCurrency(summaryToday.sales)}</p>
            <span>{summaryToday.units} units</span>
          </article>
          <article>
            <h3>7 days</h3>
            <p>{formatCurrency(summary7.sales)}</p>
            <span>{summary7.orders} orders</span>
          </article>
          <article>
            <h3>30 days</h3>
            <p>{formatCurrency(summary30.sales)}</p>
            <span>Payouts due {formatCurrency(summary30.payoutsDue)}</span>
          </article>
        </div>
        <section className={styles.panel}>
          <h2>Top products</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Units</th>
                <th scope="col">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {summary30.topProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <Link href={`/product/${product.slug}`}>{product.title}</Link>
                  </td>
                  <td>{product.units}</td>
                  <td>{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}
