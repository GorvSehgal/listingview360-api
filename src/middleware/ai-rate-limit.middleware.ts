import type { NextFunction, Request, Response } from "express";

// In-process cost guard only. Use a distributed per-account budget in production.
const events = new Map<number, { count: number; resetAt: number }>();
const maxRequestsPerHour = 5;
const windowMs = 60 * 60 * 1000;

export function aiRateLimit(req: Request, res: Response, next: NextFunction) {
  const id = req.authUser?.id;
  if (!id) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  const now = Date.now();
  const state = events.get(id);
  if (!state || state.resetAt <= now) {
    events.set(id, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }
  if (state.count >= maxRequestsPerHour) {
    res.setHeader("Retry-After", String(Math.ceil((state.resetAt - now) / 1000)));
    res.status(429).json({ success: false, message: "AI request limit reached" });
    return;
  }
  state.count += 1;
  next();
}
