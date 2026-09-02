import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger.js";
import propertyRouter from "./routes/property.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/properties", propertyRouter);

export default app;