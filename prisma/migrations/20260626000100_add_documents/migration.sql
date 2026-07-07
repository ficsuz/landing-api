-- CreateTable
CREATE TABLE "document_categories" (
    "id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" JSONB NOT NULL,
    "file_id" UUID,
    "date" DATE,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_slug_key" ON "document_categories"("slug");

-- CreateIndex
CREATE INDEX "document_categories_is_deleted_idx" ON "document_categories"("is_deleted");

-- CreateIndex
CREATE INDEX "document_categories_status_idx" ON "document_categories"("status");

-- CreateIndex
CREATE INDEX "documents_is_deleted_idx" ON "documents"("is_deleted");

-- CreateIndex
CREATE INDEX "documents_category_id_idx" ON "documents"("category_id");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "document_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
