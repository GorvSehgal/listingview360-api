import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger.js";
import propertyRouter from "./routes/property.routes.js";
import blogRouter from "./routes/blog.routes.js";
import authRouter from "./routes/auth.routes.js";
import aiRouter from "./routes/ai.routes.js";
import imageUploadRouter from "./routes/upload.routes.js";
import { publicLeadRouter, managementLeadRouter } from "./routes/lead.routes.js";
import { publicMetricsRouter, managementMetricsRouter } from "./routes/metrics.routes.js";

const app = express();
app.disable("x-powered-by");

// Requests with no Origin (such as mobile clients and curl) are not governed by CORS.
// CORS does not replace JWT authorization.
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",").map((origin) => origin.trim()).filter(Boolean),
);
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
// Image upload has its own protected 8 MB request limit; all other JSON stays at 256 KB.
app.use("/api/v1/uploads", imageUploadRouter);
app.use(express.json({ limit: "256kb" }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/properties", publicLeadRouter);
app.use("/api/v1/properties", publicMetricsRouter);
app.use("/api/v1/properties", propertyRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/viewing-requests", managementLeadRouter);
app.use("/api/v1/listing-insights", managementMetricsRouter);

// Do not return internals, SQL errors, or stack traces to API consumers.
const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.error("Unhandled API error:", error);
  if (res.headersSent) return next(error);
  res.status(500).json({ success: false, message: "Internal server error" });
};
app.use(errorHandler);

export default app;