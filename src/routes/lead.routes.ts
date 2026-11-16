import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

const requestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(7).max(35).regex(/^[+()\d\s.-]+$/),
  preferredDate: z.iso.date(),
  message: z.string().trim().max(1500).optional(),
  website: z.string().max(200).optional(),
}).strict();
const updateStatusSchema = z.object({ status: z.enum(["new", "contacted", "closed"]) }).strict();
const throttle = new Map<string, { count: number; resetAt: number }>();

export const publicLeadRouter = Router();
publicLeadRouter.post("/:id/viewing-requests", (req,res,next) => {
  const key = (req.ip ?? "unknown") + ":" + String(req.params.id);
  const now = Date.now();
  if (throttle.size > 10000) throttle.clear();
  const current = throttle.get(key);
  if (!current || current.resetAt < now) throttle.set(key, { count: 1, resetAt: now + 3600000 });
  else if (current.count >= 5) {
    res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now)/1000)));
    res.status(429).json({ success: false, message: "Too many viewing requests. Try later." });
    return;
  } else current.count++;
  next();
}, validateBody(requestSchema), async (req,res) => {
  const propertyId = Number(req.params.id);
  if (!Number.isSafeInteger(propertyId) || propertyId < 1) {
    res.status(400).json({ success: false, message: "Invalid property ID" }); return;
  }
  const property = await prisma.property.findFirst({
    where: { id: propertyId, status: "approved" }, select: { id: true },
  });
  if (!property) { res.status(404).json({ success: false, message: "Property not found" }); return; }
  const { name, email, phone, preferredDate, message, website } = req.body as z.infer<typeof requestSchema>;
  const date = new Date(preferredDate + "T12:00:00.000Z");
  const today = new Date(); today.setUTCHours(0,0,0,0);
  if (!Number.isFinite(date.getTime()) || date.getTime() < today.getTime() ||
      date.getTime() > today.getTime() + 366 * 86400000) {
    res.status(400).json({ success: false, message: "Choose a date within the next year." }); return;
  }
  if (website) { res.status(201).json({ success: true, data: { message: "Viewing request received." } }); return; }
  await prisma.viewingRequest.create({ data: {
    propertyId, name, email, phone, preferredDate: date, message: message || null,
  }, select: { id: true } });
  res.setHeader("Cache-Control", "no-store");
  res.status(201).json({ success: true, data: {
    message: "Viewing request saved. The realtor can review it in their dashboard. Your viewing is not confirmed.",
  } });
});

export const managementLeadRouter = Router();
managementLeadRouter.use(requireAuth, requireRole("admin","realtor"));
managementLeadRouter.get("/", async (req,res) => {
  const actor = req.authUser!;
  const rows = await prisma.viewingRequest.findMany({
    where: actor.role === "admin" ? {} : { property: { ownerId: actor.id } },
    select: {
      id: true, propertyId: true, name: true, email: true, phone: true,
      preferredDate: true, message: true, status: true, createdAt: true,
      property: { select: { title: true, city: true } },
    }, orderBy: { createdAt: "desc" }, take: 200,
  });
  res.setHeader("Cache-Control","no-store");
  res.json({ success: true, data: rows });
});
managementLeadRouter.patch("/:id", validateBody(updateStatusSchema), async (req,res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ success: false, message: "Invalid request ID" }); return; }
  const actor = req.authUser!;
  const row = await prisma.viewingRequest.findFirst({
    where: actor.role === "admin" ? { id } : { id, property: { ownerId: actor.id } },
    select: { id: true },
  });
  if (!row) { res.status(404).json({ success: false, message: "Viewing request not found" }); return; }
  const updated = await prisma.viewingRequest.update({
    where: { id: row.id }, data: { status: req.body.status },
    select: { id: true, status: true },
  });
  res.json({ success: true, data: updated });
});
