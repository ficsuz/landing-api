-- Content modules: drop the upstream `source_id` and replace object-key image
-- columns with `*_id` references to the Files table (loose UUIDs, no FK).
-- Dropping a column also drops its dependent unique index (e.g. *_source_id_key).

-- events
ALTER TABLE "events" DROP COLUMN "source_id";
ALTER TABLE "events" DROP COLUMN "preview_image";
ALTER TABLE "events" DROP COLUMN "image";
ALTER TABLE "events" ADD COLUMN "preview_image_id" UUID;
ALTER TABLE "events" ADD COLUMN "image_id" UUID;

-- news
ALTER TABLE "news" DROP COLUMN "source_id";
ALTER TABLE "news" DROP COLUMN "image";
ALTER TABLE "news" ADD COLUMN "image_id" UUID;

-- council_members
ALTER TABLE "council_members" DROP COLUMN "source_id";
ALTER TABLE "council_members" DROP COLUMN "photo";
ALTER TABLE "council_members" ADD COLUMN "photo_id" UUID;

-- testimonials
ALTER TABLE "testimonials" DROP COLUMN "source_id";
ALTER TABLE "testimonials" DROP COLUMN "caption";
ALTER TABLE "testimonials" DROP COLUMN "logo";
ALTER TABLE "testimonials" ADD COLUMN "caption_id" UUID;
ALTER TABLE "testimonials" ADD COLUMN "logo_id" UUID;
