import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check API health
 *     description: Returns the current status of the ListingView360 API.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: listingview360-api
 */
const router = Router();

router.get("/", getHealth);

export default router;