import Link from "next/link";
import styles from "./styles/home.module.scss";

export default function Home() {
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
      </div>
    </main>
  );
}
