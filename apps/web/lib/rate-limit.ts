interface RateLimitOptions {
  windowMs: number;
  max: number;
}

type RateLimitCheck = {
  ok: boolean;
  message?: string;
};

const buckets = new Map<string, { count: number; expiresAt: number }>();

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }

  return request.headers.get("cf-connecting-ip") ?? "anonymous";
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max } = options;

  return {
    check(request: Request): RateLimitCheck {
      const key = getClientKey(request);
      const now = Date.now();
      const bucket = buckets.get(key);

      if (!bucket || bucket.expiresAt < now) {
        buckets.set(key, { count: 1, expiresAt: now + windowMs });
        return { ok: true };
      }

      if (bucket.count >= max) {
        return {
          ok: false,
          message: "Too many requests, please slow down.",
        };
      }

      bucket.count += 1;
      buckets.set(key, bucket);
      return { ok: true };
    },
  };
}
