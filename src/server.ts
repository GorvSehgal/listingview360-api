import dotenv from "dotenv";
import app from "./app.js";
import { seedDemoProperties } from "./scripts/seed-demo.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function start() {
  // Explicit staging-only opt-in. Never clears existing records.
  if (process.env.SEED_DEMO_PROPERTIES === "true") {
    const result = await seedDemoProperties();
    console.info("Fictional demo properties checked:", result.created, "created;", result.existing, "already present");
  }

  app.listen(PORT, () => {
    console.log(`ListingView360 API is running on port ${PORT}`);
  });
}

start().catch((error: unknown) => {
  console.error("ListingView360 API startup failed:", error);
  process.exitCode = 1;
});
