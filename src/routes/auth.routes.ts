import { Router } from "express";
import { login, getCurrentUser, registerRealtor, getPendingRealtors, reviewRealtor, changePassword } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { loginRateLimit, signupRateLimit } from "../middleware/login-rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginSchema, signupSchema, reviewRealtorSchema, changePasswordSchema } from "../schemas/auth.schema.js";

const router = Router();

// Public signups are unprivileged, inactive realtor applications until admin approval.
router.post("/signup", signupRateLimit, validateBody(signupSchema), registerRealtor);
router.post("/login", loginRateLimit, validateBody(loginSchema), login);
router.get("/me", requireAuth, getCurrentUser);
router.post("/change-password", requireAuth, validateBody(changePasswordSchema), changePassword);
router.get("/realtors/pending", requireAuth, requireRole("admin"), getPendingRealtors);
router.patch("/realtors/:id/review", requireAuth, requireRole("admin"), validateBody(reviewRealtorSchema), reviewRealtor);

export default router;
