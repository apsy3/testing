import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "../../../lib/queries";
import styles from "../../styles/product.module.scss";

interface ProductPageProps {
  params: { slug: string };
}

function formatPrice(priceCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN ?? "yourstore.myshopify.com";
  const checkoutUrl = `https://${shopifyDomain}/products/${product.slug}`;

  return (
    <main className={styles.page}>
      <div className={styles.media}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : null}
      </div>
      <article className={styles.details}>
        <p className={styles.breadcrumb}>
          <Link href="/catalog">Catalog</Link> / {product.title}
        </p>
        <h1>{product.title}</h1>
        <p className={styles.price}>{formatPrice(product.priceCents, product.currency)}</p>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.actions}>
          <Link href={checkoutUrl} className={styles.buy}>
            Continue on Shopify
          </Link>
        </div>
      </article>
    </main>
  );
}
