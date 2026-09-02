import { Router } from "express";
import { getAllProperties ,getProperty, createProperty, updateProperty,deleteProperty} from "../controllers/property.controller.js";
import { createPropertySchema, updatePropertySchema } from "../schemas/property.schema.js";
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
router.post("/", validateBody(createPropertySchema),createProperty);
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
// router.patch("/:id", updateProperty);
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
router.patch("/:id",  validateBody(updatePropertySchema),updateProperty);
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
router.delete("/:id", deleteProperty);
export default router;