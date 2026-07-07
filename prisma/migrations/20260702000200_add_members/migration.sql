-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('EXECUTIVE_BOARD', 'FULL', 'OBSERVER');

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "logo_id" UUID,
    "link" TEXT,
    "type" "MemberType" NOT NULL DEFAULT 'FULL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "members_is_deleted_idx" ON "members"("is_deleted");

-- CreateIndex
CREATE INDEX "members_type_idx" ON "members"("type");

-- CreateIndex
CREATE INDEX "members_status_idx" ON "members"("status");
