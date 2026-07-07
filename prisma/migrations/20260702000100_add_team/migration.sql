-- CreateTable
CREATE TABLE "team_members" (
    "id" UUID NOT NULL,
    "full_name" JSONB NOT NULL,
    "position" JSONB NOT NULL,
    "bio" JSONB,
    "photo_id" UUID,
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

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_members_is_deleted_idx" ON "team_members"("is_deleted");

-- CreateIndex
CREATE INDEX "team_members_status_idx" ON "team_members"("status");
