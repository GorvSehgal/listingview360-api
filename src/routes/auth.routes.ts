import { Router } from "express";
import { login, getCurrentUser } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { loginRateLimit } from "../middleware/login-rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginSchema } from "../schemas/auth.schema.js";

const router = Router();

// Accounts are provisioned privately by an administrator. No public registration.
router.post("/login", loginRateLimit, validateBody(loginSchema), login);
router.get("/me", requireAuth, getCurrentUser);

export default router;
