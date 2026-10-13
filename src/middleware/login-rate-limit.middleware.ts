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


// Independently throttle public signups; short-term in-memory defense for the
// current single-instance staging API, not a substitute for edge/WAF controls.
const signupAttempts = new Map<string, { count: number; resetAt: number }>();
export function signupRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const existing = signupAttempts.get(key);
  if (!existing || existing.resetAt <= now) {
    if (signupAttempts.size >= maxEntries) {
      for (const [ip, value] of signupAttempts) {
        if (value.resetAt <= now) signupAttempts.delete(ip);
      }
      if (signupAttempts.size >= maxEntries) signupAttempts.delete(signupAttempts.keys().next().value ?? "");
    }
    signupAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    next();
    return;
  }
  if (existing.count >= 5) {
    res.setHeader("Retry-After", String(Math.ceil((existing.resetAt - now) / 1000)));
    res.status(429).json({ success: false, message: "Too many registration attempts. Try again later." });
    return;
  }
  existing.count += 1;
  next();
}
