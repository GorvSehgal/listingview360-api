CREATE TYPE "BlogStatus" AS ENUM ('draft', 'approved', 'rejected', 'published');

CREATE TABLE "BlogPost" (
  "id" SERIAL NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "BlogStatus" NOT NULL DEFAULT 'draft',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "approvedRevision" INTEGER,
  "createdById" INTEGER NOT NULL,
  "approvedById" INTEGER,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

CREATE TABLE "BlogAudit" (
  "id" SERIAL NOT NULL,
  "blogPostId" INTEGER NOT NULL,
  "actorId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BlogAudit_blogPostId_createdAt_idx" ON "BlogAudit"("blogPostId", "createdAt");
ALTER TABLE "BlogAudit" ADD CONSTRAINT "BlogAudit_blogPostId_fkey"
FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
