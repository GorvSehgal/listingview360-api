import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

const router = Router();
const articleSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140),
  title: z.string().trim().min(8).max(180),
  excerpt: z.string().trim().min(20).max(360),
  category: z.string().trim().min(2).max(70),
  body: z.string().trim().min(60).max(60000),
}).strict();
type ArticleInput = z.infer<typeof articleSchema>;

function postId(raw: string | string[] | undefined): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
function noStore(res: import("express").Response) {
  res.setHeader("Cache-Control", "no-store");
}

// Public responses never expose drafts, internal author IDs, or approval history.
router.get("/", async (_req, res) => {
  const items = await prisma.blogPost.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: 100,
    select: { slug: true, title: true, excerpt: true, category: true, publishedAt: true },
  });
  res.json({ success: true, data: items });
});

router.get("/manage", requireAuth, requireRole("admin"), async (_req, res) => {
  const items = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" }, take: 200,
    select: {
      id: true, slug: true, title: true, excerpt: true, category: true, body: true,
      status: true, revision: true, approvedRevision: true, publishedAt: true, updatedAt: true,
    },
  });
  noStore(res);
  res.json({ success: true, data: items });
});

router.get("/:slug", async (req, res) => {
  const slug = String(req.params.slug ?? "");
  const item = await prisma.blogPost.findFirst({
    where: { slug, status: "published" },
    select: { slug: true, title: true, excerpt: true, category: true, body: true, publishedAt: true, updatedAt: true },
  });
  if (!item) {
    res.status(404).json({ success: false, message: "Article not found" });
    return;
  }
  res.json({ success: true, data: item });
});

const admin = [requireAuth, requireRole("admin")] as const;

router.post("/", ...admin, validateBody(articleSchema), async (req, res) => {
  const article = req.body as ArticleInput;
  const actorId = req.authUser!.id;
  try {
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.blogPost.create({
        data: { ...article, createdById: actorId },
      });
      await tx.blogAudit.create({
        data: { blogPostId: created.id, actorId, action: "create_draft", revision: created.revision },
      });
      return created;
    });
    noStore(res);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      res.status(409).json({ success: false, message: "An article already uses this URL slug" });
      return;
    }
    throw error;
  }
});

router.patch("/:id", ...admin, validateBody(articleSchema), async (req, res) => {
  const id = postId(req.params.id);
  if (!id) { res.status(400).json({ success: false, message: "Invalid article ID" }); return; }
  const current = await prisma.blogPost.findUnique({ where: { id } });
  if (!current) { res.status(404).json({ success: false, message: "Article not found" }); return; }
  // Published copy cannot silently change. Unpublish first and go through review again.
  if (current.status === "published") {
    res.status(409).json({ success: false, message: "Unpublish the article before editing it" });
    return;
  }
  const actorId = req.authUser!.id;
  try {
    const item = await prisma.$transaction(async tx => {
      const written = await tx.blogPost.updateMany({
        where: { id, revision: current.revision, status: { not: "published" } },
        data: {
          ...(req.body as ArticleInput), status: "draft", revision: { increment: 1 },
          approvedRevision: null, approvedById: null,
        },
      });
      if (written.count !== 1) return null;
      await tx.blogAudit.create({
        data: { blogPostId: id, actorId, action: "edit_draft", revision: current.revision + 1 },
      });
      return tx.blogPost.findUnique({ where: { id } });
    });
    if (!item) { res.status(409).json({ success: false, message: "Article changed. Reload and retry." }); return; }
    noStore(res); res.json({ success: true, data: item });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      res.status(409).json({ success: false, message: "An article already uses this URL slug" }); return;
    }
    throw error;
  }
});

type Action = "approve" | "reject" | "publish" | "unpublish";
router.post("/:id/:action", ...admin, async (req, res) => {
  const id = postId(req.params.id);
  const action = req.params.action as Action;
  if (!id || !["approve", "reject", "publish", "unpublish"].includes(action)) {
    res.status(400).json({ success: false, message: "Invalid article action" }); return;
  }
  const current = await prisma.blogPost.findUnique({ where: { id } });
  if (!current) { res.status(404).json({ success: false, message: "Article not found" }); return; }
  const permitted = action === "approve" ? current.status === "draft"
    : action === "reject" ? ["draft", "approved"].includes(current.status)
    : action === "publish" ? current.status === "approved" && current.approvedRevision === current.revision
    : current.status === "published";
  if (!permitted) {
    res.status(409).json({ success: false, message: "Article must be in the correct review state" }); return;
  }
  const actorId = req.authUser!.id;
  const data = action === "approve" ? {
    status: "approved" as const, approvedRevision: current.revision, approvedById: actorId,
  } : action === "reject" ? {
    status: "rejected" as const, approvedRevision: null, approvedById: null,
  } : action === "publish" ? {
    status: "published" as const, publishedAt: new Date(),
  } : {
    status: "draft" as const, approvedRevision: null, approvedById: null, publishedAt: null,
  };
  const item = await prisma.$transaction(async tx => {
    const updated = await tx.blogPost.updateMany({
      where: { id, revision: current.revision, status: current.status }, data,
    });
    if (updated.count !== 1) return null;
    await tx.blogAudit.create({
      data: { blogPostId: id, actorId, action, revision: current.revision },
    });
    return tx.blogPost.findUnique({ where: { id } });
  });
  if (!item) { res.status(409).json({ success: false, message: "Article state changed. Reload and retry." }); return; }
  noStore(res);
  res.json({ success: true, data: item });
});

export default router;
