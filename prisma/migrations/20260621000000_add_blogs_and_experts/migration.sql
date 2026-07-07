-- CreateEnum
CREATE TYPE "ExpertType" AS ENUM ('INTERNATIONAL', 'UZBEK');

-- CreateTable
CREATE TABLE "blogs" (
    "id" UUID NOT NULL,
    "title" JSONB NOT NULL,
    "content" JSONB,
    "subject" JSONB,
    "image_id" UUID,
    "date" DATE,
    "status" INTEGER NOT NULL DEFAULT 1,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experts" (
    "id" UUID NOT NULL,
    "type" "ExpertType" NOT NULL DEFAULT 'INTERNATIONAL',
    "full_name" JSONB NOT NULL,
    "position" JSONB NOT NULL,
    "bio" JSONB,
    "image_id" UUID,
    "email" TEXT,
    "phone" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "experts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blogs_is_deleted_idx" ON "blogs"("is_deleted");

-- CreateIndex
CREATE INDEX "blogs_status_idx" ON "blogs"("status");

-- CreateIndex
CREATE INDEX "experts_is_deleted_idx" ON "experts"("is_deleted");

-- CreateIndex
CREATE INDEX "experts_type_idx" ON "experts"("type");

-- CreateIndex
CREATE INDEX "experts_status_idx" ON "experts"("status");
