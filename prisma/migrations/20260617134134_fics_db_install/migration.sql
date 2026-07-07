-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "source_id" INTEGER,
    "title" JSONB NOT NULL,
    "content" JSONB,
    "preview_image" TEXT,
    "image" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" UUID NOT NULL,
    "source_id" INTEGER,
    "title" JSONB NOT NULL,
    "content" JSONB,
    "image" TEXT,
    "date" DATE,
    "status" INTEGER NOT NULL DEFAULT 1,
    "other_link" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "council_members" (
    "id" UUID NOT NULL,
    "source_id" INTEGER,
    "full_name" JSONB NOT NULL,
    "position" JSONB NOT NULL,
    "photo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "council_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "source_id" INTEGER,
    "full_name" TEXT,
    "position" TEXT,
    "caption" TEXT,
    "logo" TEXT,
    "video_source" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_source_id_key" ON "events"("source_id");

-- CreateIndex
CREATE INDEX "events_is_deleted_idx" ON "events"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "news_source_id_key" ON "news"("source_id");

-- CreateIndex
CREATE INDEX "news_is_deleted_idx" ON "news"("is_deleted");

-- CreateIndex
CREATE INDEX "news_status_idx" ON "news"("status");

-- CreateIndex
CREATE UNIQUE INDEX "council_members_source_id_key" ON "council_members"("source_id");

-- CreateIndex
CREATE INDEX "council_members_is_deleted_idx" ON "council_members"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "testimonials_source_id_key" ON "testimonials"("source_id");

-- CreateIndex
CREATE INDEX "testimonials_is_deleted_idx" ON "testimonials"("is_deleted");

-- CreateIndex
CREATE INDEX "testimonials_status_idx" ON "testimonials"("status");
