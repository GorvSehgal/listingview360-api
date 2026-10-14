import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { aiRateLimit } from "../middleware/ai-rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { descriptionDraftSchema } from "../schemas/ai.schema.js";
import { draftListingDescription } from "../controllers/ai.controller.js";

const router = Router();

// Generates reviewable text only; the API never automatically changes a listing.
router.post("/listing-description",
  requireAuth,
  requireRole("admin", "realtor"),
  aiRateLimit,
  validateBody(descriptionDraftSchema),
  draftListingDescription,
);

export default router;
