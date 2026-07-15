-- AlterTable
ALTER TABLE "meetings" ADD COLUMN "image_ids" UUID[] DEFAULT ARRAY[]::UUID[];
