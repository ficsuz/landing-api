-- CreateTable
CREATE TABLE "meetings" (
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

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meetings_is_deleted_idx" ON "meetings"("is_deleted");

-- CreateIndex
CREATE INDEX "meetings_status_idx" ON "meetings"("status");
