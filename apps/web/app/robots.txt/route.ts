import { NextResponse } from "next/server";

const body = `User-agent: *
Allow: /

Sitemap: ${process.env.APP_URL ?? "https://example.com"}/sitemap.xml`;

export function GET() {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
