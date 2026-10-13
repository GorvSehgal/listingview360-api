
-- Existing inventory is private until reviewed by an administrator.
CREATE TYPE "ListingStatus" AS ENUM ('pending', 'approved', 'rejected');
ALTER TABLE "Property"
 ADD COLUMN "status" "ListingStatus" NOT NULL DEFAULT 'pending',
 ADD COLUMN "reviewedAt" TIMESTAMP(3),
 ADD COLUMN "reviewedById" INTEGER;
CREATE INDEX "Property_status_idx" ON "Property"("status");
