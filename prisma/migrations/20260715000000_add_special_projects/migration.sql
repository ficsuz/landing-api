-- CreateTable
CREATE TABLE "special_projects" (
    "id" UUID NOT NULL,
    "title" JSONB NOT NULL,
    "link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "special_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "special_projects_is_deleted_idx" ON "special_projects"("is_deleted");

-- CreateIndex
CREATE INDEX "special_projects_status_idx" ON "special_projects"("status");
