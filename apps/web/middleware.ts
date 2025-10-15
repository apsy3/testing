import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const isProd = process.env.NODE_ENV === "production";

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "geolocation=()");

  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https:",
    "font-src 'self' https: data:",
    "frame-ancestors 'none'",
  ].join("; ");
  res.headers.set("Content-Security-Policy", csp);

  if (isProd) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return res;
}
