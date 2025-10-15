import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const loginLimiter = rateLimit({ windowMs: 60_000, max: 10 });

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const limited = loginLimiter.check(request);
  if (!limited.ok) {
    return NextResponse.json({ error: limited.message ?? "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
    },
  });

  const emailRedirectTo = `${process.env.APP_URL ?? "http://localhost:3000"}/login`;
  const { error } = await client.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo },
  });

  if (error) {
    console.error("Supabase OTP request failed", { code: error.code });
    return NextResponse.json({ error: "Unable to send login email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
