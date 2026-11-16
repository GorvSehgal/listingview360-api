import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { Router } from "express";
import { getAllProperties, getProperty, getManagementProperties, reviewProperty, createProperty, updateProperty, deleteProperty } from "../controllers/property.controller.js";
import { createPropertySchema, updatePropertySchema, reviewPropertySchema } from "../schemas/property.schema.js";
import { validateBody } from "../middleware/validate.middleware.js";
/**
 * @openapi
 * /properties:
 *   get:
 *     summary: get all properties
 *     description: Returns all available properties.
 *     tags:
 *       - Properties
 *     responses:
 *       200:
 *         description: returns all available properties
 * content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertiesResponse'
 *         
 *            
 */
const router = Router();


router.get("/", getAllProperties);
router.get("/manage", requireAuth, requireRole("admin", "realtor"), getManagementProperties);
/**
 * @openapi
 * /properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     description: Returns a single property by its unique ID.
 *     tags:
 *       - Properties
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 */
router.get("/:id", getProperty);
/**
 * @openapi
 * /properties:
 *   post:
 *     summary: Create new property
 *     description: Creates a new property with the provided details.
 *     tags:
 *       - Properties
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 * */
router.post("/", requireAuth, requireRole("admin", "realtor"), validateBody(createPropertySchema), createProperty);
/**
 * @openapi
 * /properties/{id}:
 *   patch:
 *     summary: Update property
 *     description: Updates one or more fields of an existing property.
 *     tags:
 *       - Properties
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       404:
 *         description: Property not found
 */

/**
 * @openapi
 * /properties/{id}:
 *   patch:
 *     summary: Update property
 *     description: Updates one or more fields of an existing property.
 *     tags:
 *       - Properties
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *           example:
 *             price: 910000
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       404:
 *         description: Property not found
 */
router.patch("/:id", requireAuth, requireRole("admin", "realtor"), validateBody(updatePropertySchema), updateProperty);
router.patch("/:id/review", requireAuth, requireRole("admin"), validateBody(reviewPropertySchema), reviewProperty);
/**
 * @openapi
 * /properties/{id}:
 *   delete:
 *     summary: Delete property
 *     description: Deletes a property by its unique ID.
 *     tags:
 *       - Properties
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       404:
 *         description: Property not found
 */
router.delete("/:id", requireAuth, requireRole("admin", "realtor"), deleteProperty);
export default router;