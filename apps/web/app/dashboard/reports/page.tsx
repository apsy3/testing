import { getKpiSummary, getKpiTimeseries } from "../../../lib/queries";
import styles from "../../styles/reports.module.scss";

export const metadata = {
  title: "Dashboard Reports",
};

function formatCurrency(value: number, currency = "USD") {
  return (value / 100).toLocaleString("en-US", { style: "currency", currency });
}

export default async function ReportsPage() {
  const [summary7, summary30, summary90, timeseries] = await Promise.all([
    getKpiSummary("7d"),
    getKpiSummary("30d"),
    getKpiSummary("90d"),
    getKpiTimeseries("90d"),
  ]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Performance reports</h1>
        <p>Compare rolling windows and inspect trailing 90 day daily performance.</p>
      </header>
      <section className={styles.grid}>
        {[{ label: "7 days", data: summary7 }, { label: "30 days", data: summary30 }, { label: "90 days", data: summary90 }].map(
          ({ label, data }) => (
            <article key={label}>
              <h2>{label}</h2>
              <dl>
                <div>
                  <dt>GMV</dt>
                  <dd>{formatCurrency(data.gmv)}</dd>
                </div>
                <div>
                  <dt>Orders</dt>
                  <dd>{data.orders}</dd>
                </div>
                <div>
                  <dt>Units</dt>
                  <dd>{data.units}</dd>
                </div>
                <div>
                  <dt>Repeat rate</dt>
                  <dd>{(data.repeatRate * 100).toFixed(1)}%</dd>
                </div>
              </dl>
            </article>
          ),
        )}
      </section>
      <section className={styles.panel}>
        <h2>Daily GMV & orders (90d)</h2>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">GMV</th>
                <th scope="col">Orders</th>
              </tr>
            </thead>
            <tbody>
              {timeseries.map(point => (
                <tr key={point.date}>
                  <td>{point.date}</td>
                  <td>{formatCurrency(point.gmv)}</td>
                  <td>{point.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
