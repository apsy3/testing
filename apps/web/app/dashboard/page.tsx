import Link from "next/link";
import { getDashboardOverview } from "../../lib/queries";
import styles from "../styles/dashboard.module.scss";

export const metadata = {
  title: "Dashboard",
};

function formatCurrency(value: number, currency = "USD") {
  return (value / 100).toLocaleString("en-US", { style: "currency", currency });
}

export default async function DashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Executive dashboard</h1>
        <p>Monitor gross merchandise value, order velocity, and top-performing products.</p>
        <Link href="/dashboard/reports" className={styles.link}>
          View detailed reports
        </Link>
      </header>
      <section className={styles.metrics}>
        <article>
          <p>30-day GMV</p>
          <strong>{formatCurrency(overview.summary.gmv)}</strong>
        </article>
        <article>
          <p>Average order value</p>
          <strong>{formatCurrency(Math.round(overview.summary.aov))}</strong>
        </article>
        <article>
          <p>Orders</p>
          <strong>{overview.summary.orders}</strong>
        </article>
        <article>
          <p>Repeat rate</p>
          <strong>{(overview.summary.repeatRate * 100).toFixed(1)}%</strong>
        </article>
      </section>
      <section className={styles.panel}>
        <h2>Top products (30d)</h2>
        <ol>
          {overview.topProducts.map(item => (
            <li key={item.id}>
              <span>{item.title}</span>
              <span>{item.units} units</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
