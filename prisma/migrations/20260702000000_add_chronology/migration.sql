-- CreateTable
CREATE TABLE "chronology" (
    "id" UUID NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "date" DATE,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "chronology_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chronology_is_deleted_idx" ON "chronology"("is_deleted");

-- CreateIndex
CREATE INDEX "chronology_status_idx" ON "chronology"("status");
