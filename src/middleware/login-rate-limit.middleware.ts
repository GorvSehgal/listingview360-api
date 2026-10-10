import type { Request, Response, NextFunction } from "express";

// Development/single-instance safety net. Enforce distributed throttling at the
// API gateway or Redis before running multiple instances in production.
const windowMs = 15 * 60 * 1000;
const maxAttempts = 10;
const maxEntries = 10000;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const existing = attempts.get(key);
  if (!existing || existing.resetAt <= now) {
    if (attempts.size >= maxEntries) {
      for (const [ip, value] of attempts) {
        if (value.resetAt <= now) attempts.delete(ip);
      }
      if (attempts.size >= maxEntries) attempts.delete(attempts.keys().next().value ?? "");
    }
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }
  if (existing.count >= maxAttempts) {
    res.setHeader("Retry-After", String(Math.ceil((existing.resetAt - now) / 1000)));
    res.status(429).json({ success: false, message: "Too many login attempts" });
    return;
  }
  existing.count += 1;
  next();
}
