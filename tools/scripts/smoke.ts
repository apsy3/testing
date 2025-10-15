import 'dotenv/config';

const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';

async function check(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed ${path} (${response.status})`);
  }
  return response.json().catch(() => ({}));
}

async function main() {
  console.log('Running smoke tests against', baseUrl);
  await check('/api/health');
  await check('/api/kpis?range=7d');
  await check('/api/kpis/timeseries?range=90d&granularity=day');
  console.log('Smoke tests passed');
}

main().catch(error => {
  console.error('Smoke tests failed:', error.message);
  process.exitCode = 1;
});
