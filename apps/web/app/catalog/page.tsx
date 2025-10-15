import Image from "next/image";
import Link from "next/link";
import styles from "../styles/catalog.module.scss";

const mockedProducts = [
  {
    id: "ring-gilded-aurora",
    title: "Gilded Aurora Ring",
    priceCents: 125000,
    currency: "USD",
    imageUrl:
      "https://cdn.shopify.com/static/sample-images/golden-wristwatch.jpg",
  },
  {
    id: "silk-scarf-midnight",
    title: "Midnight Silk Scarf",
    priceCents: 28000,
    currency: "USD",
    imageUrl: "https://cdn.shopify.com/static/sample-images/ladies-jacket.jpg",
  },
];

export const metadata = {
  title: "Catalog",
};

function formatPrice(priceCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
}

export default function CatalogPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Catalog</h1>
        <p>Preview of highlighted pieces while Shopify data syncing is wired.</p>
      </header>
      <section className={styles.grid}>
        {mockedProducts.map((product) => (
          <article key={product.id} className={styles.card}>
            <div className={styles.imageWrap}>
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <div className={styles.cardBody}>
              <h2>{product.title}</h2>
              <p>{formatPrice(product.priceCents, product.currency)}</p>
              <Link href={`https://${process.env.SHOPIFY_STORE_DOMAIN ?? "yourstore.myshopify.com"}/products/${product.id}`}>
                View on Shopify
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
