-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "preview_image_id" UUID,
    "file_id" UUID,
    "date" DATE,
    "status" INTEGER NOT NULL DEFAULT 1,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_is_deleted_idx" ON "reports"("is_deleted");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");
