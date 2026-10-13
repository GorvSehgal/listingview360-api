CREATE TYPE "ViewingRequestStatus" AS ENUM ('new','contacted','closed');
CREATE TABLE "ViewingRequest" (
"id" SERIAL NOT NULL, "propertyId" INTEGER NOT NULL, "name" TEXT NOT NULL,
"email" TEXT NOT NULL, "phone" TEXT NOT NULL, "preferredDate" TIMESTAMP(3) NOT NULL,
"message" TEXT, "status" "ViewingRequestStatus" NOT NULL DEFAULT 'new',
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "ViewingRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ViewingRequest_propertyId_createdAt_idx" ON "ViewingRequest"("propertyId","createdAt");
CREATE INDEX "ViewingRequest_status_idx" ON "ViewingRequest"("status");
ALTER TABLE "ViewingRequest" ADD CONSTRAINT "ViewingRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "PropertyMetrics" ("propertyId" INTEGER NOT NULL,"views" INTEGER NOT NULL DEFAULT 0,
"tourStarts" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "PropertyMetrics_pkey" PRIMARY KEY ("propertyId"));
ALTER TABLE "PropertyMetrics" ADD CONSTRAINT "PropertyMetrics_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;