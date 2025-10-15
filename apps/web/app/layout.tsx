import type { Metadata } from "next";
import "./styles/main.scss";

function resolveMetadataBase() {
  const fallback = "http://localhost:3000";
  const base = process.env.APP_URL ?? fallback;
  try {
    return new URL(base);
  } catch (error) {
    console.warn(`Invalid APP_URL '${base}'. Falling back to ${fallback}.`);
    return new URL(fallback);
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Luxury Heritage",
    template: "%s • Luxury Heritage",
  },
  description:
    "Discover curated artisanal jewelry and objects celebrating heritage craftsmanship.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
