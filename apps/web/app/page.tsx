import Image from "next/image";
import Link from "next/link";
import { getFeaturedProducts, getKpiSummary } from "../lib/queries";
import styles from "./styles/home.module.scss";

export default async function Home() {
  const [featured, kpis] = await Promise.all([
    getFeaturedProducts(4),
    getKpiSummary("30d"),
  ]);

  return (
    <main className={styles.hero}>
      <div className={styles.container}>
        <p className={styles.kicker}>Luxury Heritage</p>
        <h1 className={styles.title}>Timeless craft, thoughtfully curated.</h1>
        <p className={styles.copy}>
          We partner with artisans across the globe to bring limited collections
          of jewelry and decor steeped in heritage techniques. Explore the
          catalog to discover pieces that resonate.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryCta} href="/catalog">
            Browse catalog
          </Link>
          <Link className={styles.secondaryCta} href="/about">
            Our story
          </Link>
        </div>
        <section className={styles.metrics} aria-label="Store performance snapshot">
          <div>
            <p className={styles.metricLabel}>30-day GMV</p>
            <p className={styles.metricValue}>
              {(kpis.gmv / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
          </div>
          <div>
            <p className={styles.metricLabel}>Orders</p>
            <p className={styles.metricValue}>{kpis.orders}</p>
          </div>
          <div>
            <p className={styles.metricLabel}>Repeat rate</p>
            <p className={styles.metricValue}>
              {(kpis.repeatRate * 100).toFixed(1)}%
            </p>
          </div>
        </section>
      </div>

      <section className={styles.featured} aria-label="Featured products">
        {featured.map((product) => (
          <article key={product.id} className={styles.featuredCard}>
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.title}
                width={360}
                height={480}
                className={styles.featuredImage}
              />
            ) : null}
            <div className={styles.featuredContent}>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
              <Link href={`/product/${product.slug}`} className={styles.link}>
                View details
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
