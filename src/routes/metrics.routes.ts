import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

const eventSchema = z.object({ event: z.enum(["view","tour_start"]) }).strict();
const lastEvent = new Map<string,number>();
export const publicMetricsRouter = Router();
publicMetricsRouter.post("/:id/metrics", validateBody(eventSchema), async (req,res) => {
  const propertyId = Number(req.params.id);
  if (!Number.isSafeInteger(propertyId) || propertyId < 1) {
    res.status(400).json({ success: false, message: "Invalid property ID" }); return;
  }
  const found = await prisma.property.findFirst({
    where: { id: propertyId, status: "approved" }, select: { id: true },
  });
  if (!found) { res.status(404).json({ success: false, message: "Property not found" }); return; }
  const event = req.body.event as "view" | "tour_start";
  const key = (req.ip ?? "unknown") + ":" + propertyId + ":" + event;
  const now = Date.now();
  if ((lastEvent.get(key) ?? 0) + 900000 < now) {
    if (lastEvent.size > 15000) lastEvent.clear();
    lastEvent.set(key, now);
    await prisma.propertyMetrics.upsert({
      where: { propertyId },
      create: { propertyId, views: event === "view" ? 1 : 0, tourStarts: event === "tour_start" ? 1 : 0 },
      update: event === "view" ? { views: { increment: 1 } } : { tourStarts: { increment: 1 } },
    });
  }
  res.status(202).json({ success: true, data: { message: "Recorded" } });
});
export const managementMetricsRouter = Router();
managementMetricsRouter.get("/", requireAuth,requireRole("admin","realtor"), async (req,res) => {
  const actor = req.authUser!;
  const rows = await prisma.propertyMetrics.findMany({
    where: actor.role === "admin" ? {} : { property: { ownerId: actor.id } },
    select: { propertyId:true,views:true,tourStarts:true,
      property: { select: { title:true,city:true,status:true } },
    }, orderBy: { views:"desc" }, take:200,
  });
  res.setHeader("Cache-Control","no-store");
  res.json({ success:true,data:rows });
});
