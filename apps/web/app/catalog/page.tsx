import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { getCatalogProducts, listArtisans } from "../../lib/queries";
import styles from "../styles/catalog.module.scss";

const searchParamsSchema = z.object({
  q: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional(),
  artisan: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform(value => (value ? (Array.isArray(value) ? value : [value]) : undefined)),
});

export const metadata = {
  title: "Catalog",
};

function formatPrice(priceCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
}

interface CatalogPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const parsed = searchParamsSchema.safeParse(searchParams ?? {});
  if (!parsed.success) {
    throw new Error("Invalid catalog filters");
  }

  const { q, sort = "newest", artisan } = parsed.data;
  const query = q?.trim();
  const [products, artisans] = await Promise.all([
    getCatalogProducts({ search: query, sort, artisanIds: artisan }),
    listArtisans(),
  ]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Catalog</h1>
        <p>Browse the latest curated releases directly synchronized from Shopify.</p>
        <form className={styles.filters} method="get">
          <label className={styles.field}>
            <span>Search</span>
            <input
              type="search"
              name="q"
              placeholder="Search products"
              defaultValue={query ?? ""}
            />
          </label>
          <label className={styles.field}>
            <span>Artisan</span>
            <select name="artisan" defaultValue={artisan?.[0] ?? ""}>
              <option value="">All artisans</option>
              {artisans.map(item => (
                <option key={item.id} value={item.id ?? ""}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Sort</span>
            <select name="sort" defaultValue={sort}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
          <button type="submit" className={styles.submit}>
            Apply
          </button>
        </form>
      </header>
      <section className={styles.grid}>
        {products.map(product => (
          <article key={product.id} className={styles.card}>
            <div className={styles.imageWrap}>
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              ) : null}
            </div>
            <div className={styles.cardBody}>
              <h2>{product.title}</h2>
              <p>{formatPrice(product.priceCents, product.currency)}</p>
              <Link href={`/product/${product.slug}`}>View details</Link>
            </div>
          </article>
        ))}
        {products.length === 0 ? (
          <p className={styles.empty}>No products match your filters yet.</p>
        ) : null}
      </section>
    </main>
  );
}
