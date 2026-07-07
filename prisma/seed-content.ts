import 'dotenv/config';
import { PrismaClient, Prisma, ExpertType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import axios from 'axios';
import { promises as fs } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';

/**
 * Content seeder — dumps the upstream FIC CMS data into the local database.
 *
 * For each resource it pulls the upstream rows (Laravel paginator vs plain
 * array), and for every referenced image it: downloads the bytes, creates a
 * `Files` row (so the image becomes a first-class file with a UUID id), saves
 * the bytes locally as `<fileId><ext>` — the exact object key the Files module
 * serves from MinIO (`GET /files/:id`) — and links the content row to that file
 * by id. Upload the local folder to MinIO by hand and the keys line up.
 *
 * Re-runnable: each resource is reset (its rows + the files they reference are
 * deleted, local copies included) before a fresh load — no upstream id is kept.
 *
 *   yarn seed:content                      # all resources
 *   yarn seed:content events news          # only the named resources
 */

const BASE_URL = (process.env.IMPORT_SOURCE_BASE_URL ?? 'https://fic.uniplatforms.uz/api').replace(
  /\/+$/,
  '',
);
const IMPORT_DIR = resolve(process.env.LOCAL_IMPORT_DIR ?? './storage/imports');
const BUCKET = process.env.MINIO_BUCKET ?? 'uploads';
const PER_PAGE = 50;
const REQUEST_TIMEOUT_MS = 30_000;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['error', 'warn'], errorFormat: 'minimal' });

// ── Helpers ─────────────────────────────────────────────────────────────────

interface UpstreamEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface LaravelPaginator<T> {
  current_page: number;
  data: T[];
  last_page: number;
}

type Translation = { en: string; ru: string; uz: string };

const stats = { files: 0, filesFailed: 0 };

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const errMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** GET <base>/api/v1/<resource> and return the unwrapped `data` payload. */
async function fetchData<T>(
  resource: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = `${BASE_URL}/api/v1/${resource}`;
  const response = await axios.get<UpstreamEnvelope<T>>(url, {
    params,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { Accept: 'application/json', 'X-USER-LANG': 'en' },
  });
  return response.data.data;
}

/** Walk every page of a Laravel-paginated resource and flatten the rows. */
async function fetchAllPages<T>(resource: string): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const paginator = await fetchData<LaravelPaginator<T>>(resource, { page, per_page: PER_PAGE });
    rows.push(...paginator.data);
    lastPage = paginator.last_page;
    page += 1;
  } while (page <= lastPage);
  return rows;
}

/**
 * Download one upstream image into the local Files system: create a Files row,
 * save the bytes as `<fileId><ext>`, and return the new file id (or null when
 * there is no image / the download fails — a failure never aborts the run).
 */
async function storeFile(
  key: string | null | undefined,
  actorId: string | null,
): Promise<string | null> {
  if (!key) return null;
  const safeKey = key.replace(/^\/+/, '');
  try {
    const response = await axios.get<ArrayBuffer>(`${BASE_URL}/${safeKey}`, {
      responseType: 'arraybuffer',
      timeout: REQUEST_TIMEOUT_MS,
    });
    const buffer = Buffer.from(response.data);
    const ext = extname(safeKey).toLowerCase();
    const headerType = response.headers['content-type'];
    const type =
      typeof headerType === 'string'
        ? headerType
        : (MIME_BY_EXT[ext] ?? 'application/octet-stream');

    // Create the row first so its id seeds the object key (mirrors FilesService).
    const file = await prisma.files.create({
      data: {
        name: basename(safeKey),
        type,
        size: buffer.length,
        bucketName: BUCKET,
        createdById: actorId,
      },
      select: { id: true },
    });
    const objectKey = `${file.id}${ext}`;

    const localPath = join(IMPORT_DIR, objectKey);
    await fs.mkdir(dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
    await prisma.files.update({ where: { id: file.id }, data: { path: objectKey } });

    stats.files += 1;
    return file.id;
  } catch (error) {
    stats.filesFailed += 1;
    console.warn(`   ⚠ file download failed (${safeKey}): ${errMessage(error)}`);
    return null;
  }
}

/** Delete the given Files rows and their local copies (used when resetting a resource). */
async function deleteFiles(ids: (string | null)[]): Promise<void> {
  const fileIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (fileIds.length === 0) return;
  const files = await prisma.files.findMany({
    where: { id: { in: fileIds } },
    select: { path: true },
  });
  for (const f of files) {
    if (f.path) await fs.rm(join(IMPORT_DIR, f.path), { force: true }).catch(() => undefined);
  }
  await prisma.files.deleteMany({ where: { id: { in: fileIds } } });
}

const trans = (en: string | null, ru: string | null, uz: string | null): Translation => ({
  en: en ?? '',
  ru: ru ?? '',
  uz: uz ?? '',
});

const toDate = (value: string | null | undefined): Date | null => (value ? new Date(value) : null);

// Default document categories (the Documents page tabs), seeded before the
// documents themselves. Categories are now a first-class table (admin-managed),
// not an enum.
const DEFAULT_DOCUMENT_CATEGORIES: { slug: string; name: Translation }[] = [
  { slug: 'annual-reports', name: { en: 'Annual reports', ru: 'Годовые отчёты', uz: 'Yillik hisobotlar' } },
  {
    slug: 'working-group-minutes',
    name: { en: 'Working group minutes', ru: 'Протоколы рабочих групп', uz: 'Ishchi guruh bayonnomalari' },
  },
  {
    slug: 'presidential-decrees',
    name: { en: 'Presidential decrees', ru: 'Указы президента', uz: 'Prezident farmonlari' },
  },
  { slug: 'council-minutes', name: { en: 'Council minutes', ru: 'Протоколы совета', uz: 'Kengash bayonnomalari' } },
  {
    slug: 'founding-documents',
    name: { en: 'Founding documents', ru: 'Учредительные документы', uz: 'Ta’sis hujjatlari' },
  },
];

const DEFAULT_DOCUMENT_SLUGS = new Set(DEFAULT_DOCUMENT_CATEGORIES.map((c) => c.slug));

// Normalize an upstream category label (e.g. "Working group minutes") to a known
// category slug; unknown values fall back to 'annual-reports'.
const toCategorySlug = (value: string | null | undefined): string => {
  const slug = (value ?? '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  return DEFAULT_DOCUMENT_SLUGS.has(slug) ? slug : 'annual-reports';
};

// ── Upstream record shapes ──────────────────────────────────────────────────

interface UpstreamEvent {
  id: number;
  preview_image: string | null;
  image: string | null;
  dates: string[] | null;
  title_uz: string | null;
  title_ru: string | null;
  title_en: string | null;
  content_uz: string | null;
  content_ru: string | null;
  content_en: string | null;
}

interface UpstreamNews {
  id: number;
  image: string | null;
  date: string | null;
  title_uz: string | null;
  title_ru: string | null;
  title_en: string | null;
  content_uz: string | null;
  content_ru: string | null;
  content_en: string | null;
  status: number;
  other_link: string | null;
}

interface UpstreamCouncilMember {
  id: number;
  photo: string | null;
  full_name_uz: string | null;
  full_name_ru: string | null;
  full_name_en: string | null;
  position_uz: string | null;
  position_ru: string | null;
  position_en: string | null;
}

interface UpstreamTestimonial {
  id: number;
  full_name: string | null;
  caption: string | null;
  video_source: string | null;
  logo: string | null;
  position: string | null;
  order: number;
  status: boolean;
}

interface UpstreamBlogSubject {
  id: number;
  name_uz: string | null;
  name_ru: string | null;
  name_en: string | null;
}

interface UpstreamBlog {
  id: number;
  subject_id: number | null;
  image: string | null;
  date: string | null;
  title_uz: string | null;
  title_ru: string | null;
  title_en: string | null;
  content_uz: string | null;
  content_ru: string | null;
  content_en: string | null;
  status: number;
  subject: UpstreamBlogSubject | null;
}

interface UpstreamExpert {
  id: number;
  photo: string | null;
  full_name_uz: string | null;
  full_name_ru: string | null;
  full_name_en: string | null;
  position_uz: string | null;
  position_ru: string | null;
  position_en: string | null;
  bio_uz: string | null;
  bio_ru: string | null;
  bio_en: string | null;
  email: string | null;
  phone: string | null;
}

interface UpstreamReport {
  id: number;
  preview_image: string | null;
  file: string | null;
  date: string | null;
  title_uz: string | null;
  title_ru: string | null;
  title_en: string | null;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  status: number;
}

interface UpstreamChronology {
  id: number;
  date: string | null;
  title_uz: string | null;
  title_ru: string | null;
  title_en: string | null;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  order: number | null;
  status: number | null;
}

interface UpstreamCouncilCalendar {
  id: number;
  date: string | null;
  title_uz: string | null;
  title_ru: string | null;
  title_en: string | null;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  order: number | null;
  status: number | null;
}

interface UpstreamDocument {
  id: number;
  category: string | null;
  file: string | null;
  date: string | null;
  title_uz: string | null;
  title_ru: string | null;
  title_en: string | null;
  order: number | null;
  status: boolean | null;
}

interface UpstreamUzbekExpert {
  id: number;
  image: string | null;
  full_name_uz: string | null;
  full_name_ru: string | null;
  full_name_en: string | null;
  position_uz: string | null;
  position_ru: string | null;
  position_en: string | null;
  about_uz: string | null;
  about_ru: string | null;
  about_en: string | null;
  order: number;
  status: boolean;
}

// ── Per-resource importers (reset → fetch → insert) ─────────────────────────

async function importEvents(actorId: string | null): Promise<number> {
  const old = await prisma.events.findMany({ select: { previewImageId: true, imageId: true } });
  await prisma.events.deleteMany({});
  await deleteFiles(old.flatMap((r) => [r.previewImageId, r.imageId]));

  const records = await fetchAllPages<UpstreamEvent>('weekly-events');
  for (const r of records) {
    const previewImageId = await storeFile(r.preview_image, actorId);
    const imageId = await storeFile(r.image, actorId);
    const hasContent = r.content_en || r.content_ru || r.content_uz;

    await prisma.events.create({
      data: {
        title: trans(r.title_en, r.title_ru, r.title_uz),
        content: hasContent ? trans(r.content_en, r.content_ru, r.content_uz) : Prisma.DbNull,
        previewImageId,
        imageId,
        startDate: toDate(r.dates?.[0]),
        endDate: toDate(r.dates?.[1]),
        createdById: actorId,
      },
    });
  }
  return records.length;
}

async function importNews(actorId: string | null): Promise<number> {
  const old = await prisma.news.findMany({ select: { imageId: true } });
  await prisma.news.deleteMany({});
  await deleteFiles(old.map((r) => r.imageId));

  const records = await fetchAllPages<UpstreamNews>('news');
  for (const r of records) {
    const imageId = await storeFile(r.image, actorId);
    const hasContent = r.content_en || r.content_ru || r.content_uz;

    await prisma.news.create({
      data: {
        title: trans(r.title_en, r.title_ru, r.title_uz),
        content: hasContent ? trans(r.content_en, r.content_ru, r.content_uz) : Prisma.DbNull,
        imageId,
        date: toDate(r.date),
        status: r.status ?? 1,
        otherLink: r.other_link,
        createdById: actorId,
      },
    });
  }
  return records.length;
}

async function importCouncil(actorId: string | null): Promise<number> {
  const old = await prisma.council.findMany({ select: { photoId: true } });
  await prisma.council.deleteMany({});
  await deleteFiles(old.map((r) => r.photoId));

  const records = await fetchData<UpstreamCouncilMember[]>('council-members');
  for (const [index, r] of records.entries()) {
    const photoId = await storeFile(r.photo, actorId);

    await prisma.council.create({
      data: {
        fullName: trans(r.full_name_en, r.full_name_ru, r.full_name_uz),
        position: trans(r.position_en, r.position_ru, r.position_uz),
        photoId,
        order: index,
        createdById: actorId,
      },
    });
  }
  return records.length;
}

async function importTestimonials(actorId: string | null): Promise<number> {
  const old = await prisma.testimonials.findMany({ select: { captionId: true, logoId: true } });
  await prisma.testimonials.deleteMany({});
  await deleteFiles(old.flatMap((r) => [r.captionId, r.logoId]));

  const records = await fetchData<UpstreamTestimonial[]>('expert-feedbacks');
  for (const r of records) {
    const captionId = await storeFile(r.caption, actorId);
    const logoId = await storeFile(r.logo, actorId);

    await prisma.testimonials.create({
      data: {
        fullName: r.full_name,
        position: r.position,
        captionId,
        logoId,
        videoSource: r.video_source,
        order: r.order ?? 0,
        status: r.status ?? true,
        createdById: actorId,
      },
    });
  }
  return records.length;
}

async function importBlogs(actorId: string | null): Promise<number> {
  const old = await prisma.blogs.findMany({ select: { imageId: true } });
  await prisma.blogs.deleteMany({});
  await deleteFiles(old.map((r) => r.imageId));

  const records = await fetchAllPages<UpstreamBlog>('blogs');
  for (const r of records) {
    const imageId = await storeFile(r.image, actorId);
    const hasContent = r.content_en || r.content_ru || r.content_uz;

    await prisma.blogs.create({
      data: {
        title: trans(r.title_en, r.title_ru, r.title_uz),
        content: hasContent ? trans(r.content_en, r.content_ru, r.content_uz) : Prisma.DbNull,
        subject: r.subject
          ? trans(r.subject.name_en, r.subject.name_ru, r.subject.name_uz)
          : Prisma.DbNull,
        imageId,
        date: toDate(r.date),
        status: r.status ?? 1,
        createdById: actorId,
      },
    });
  }
  return records.length;
}

async function importReports(actorId: string | null): Promise<number> {
  const old = await prisma.reports.findMany({ select: { previewImageId: true, fileId: true } });
  await prisma.reports.deleteMany({});
  await deleteFiles(old.flatMap((r) => [r.previewImageId, r.fileId]));

  const records = await fetchAllPages<UpstreamReport>('reports');
  for (const r of records) {
    const previewImageId = await storeFile(r.preview_image, actorId);
    const fileId = await storeFile(r.file, actorId);
    const hasDescription = r.description_en || r.description_ru || r.description_uz;

    await prisma.reports.create({
      data: {
        title: trans(r.title_en, r.title_ru, r.title_uz),
        description: hasDescription
          ? trans(r.description_en, r.description_ru, r.description_uz)
          : Prisma.DbNull,
        previewImageId,
        fileId,
        date: toDate(r.date),
        status: r.status ?? 1,
        createdById: actorId,
      },
    });
  }
  return records.length;
}

// The Council chronology has no image/file references, so no storeFile cleanup
// is needed — reset the rows and reload from the upstream timeline feed.
async function importChronology(actorId: string | null): Promise<number> {
  await prisma.chronology.deleteMany({});

  const records = await fetchAllPages<UpstreamChronology>('chronology');
  for (const [index, r] of records.entries()) {
    const hasDescription = r.description_en || r.description_ru || r.description_uz;

    await prisma.chronology.create({
      data: {
        title: trans(r.title_en, r.title_ru, r.title_uz),
        description: hasDescription
          ? trans(r.description_en, r.description_ru, r.description_uz)
          : Prisma.DbNull,
        date: toDate(r.date),
        order: r.order ?? index,
        status: r.status ?? 1,
        createdById: actorId,
      },
    });
  }
  return records.length;
}

// The Council Calendar has no image/file references either — reset the rows and
// reload from the upstream calendar feed.
async function importCouncilCalendar(actorId: string | null): Promise<number> {
  await prisma.councilCalendar.deleteMany({});

  const records = await fetchAllPages<UpstreamCouncilCalendar>('council-calendar');
  for (const [index, r] of records.entries()) {
    const hasDescription = r.description_en || r.description_ru || r.description_uz;

    await prisma.councilCalendar.create({
      data: {
        title: trans(r.title_en, r.title_ru, r.title_uz),
        description: hasDescription
          ? trans(r.description_en, r.description_ru, r.description_uz)
          : Prisma.DbNull,
        date: toDate(r.date),
        order: r.order ?? index,
        status: r.status ?? 1,
        createdById: actorId,
      },
    });
  }
  return records.length;
}

async function importDocuments(actorId: string | null): Promise<number> {
  // Reset documents first (they reference categories via FK), then categories.
  const oldDocs = await prisma.documents.findMany({ select: { fileId: true } });
  await prisma.documents.deleteMany({});
  await deleteFiles(oldDocs.map((r) => r.fileId));
  await prisma.documentCategories.deleteMany({});

  // Seed the default categories and index them by slug.
  const categoryIdBySlug = new Map<string, string>();
  let fallbackCategoryId = '';
  for (const [index, c] of DEFAULT_DOCUMENT_CATEGORIES.entries()) {
    const created = await prisma.documentCategories.create({
      data: { name: c.name, slug: c.slug, order: index, createdById: actorId },
      select: { id: true },
    });
    categoryIdBySlug.set(c.slug, created.id);
    if (c.slug === 'annual-reports') fallbackCategoryId = created.id;
  }

  const records = await fetchAllPages<UpstreamDocument>('documents');
  for (const [index, r] of records.entries()) {
    const fileId = await storeFile(r.file, actorId);
    const categoryId = categoryIdBySlug.get(toCategorySlug(r.category)) ?? fallbackCategoryId;

    await prisma.documents.create({
      data: {
        categoryId,
        title: trans(r.title_en, r.title_ru, r.title_uz),
        fileId,
        date: toDate(r.date),
        order: r.order ?? index,
        status: r.status ?? true,
        createdById: actorId,
      },
    });
  }
  return records.length;
}

// Both upstream feeds land in the one `experts` table, distinguished by `type`.
async function importExperts(actorId: string | null): Promise<number> {
  const old = await prisma.experts.findMany({ select: { imageId: true } });
  await prisma.experts.deleteMany({});
  await deleteFiles(old.map((r) => r.imageId));

  let count = 0;

  const international = await fetchData<UpstreamExpert[]>('experts');
  for (const [index, r] of international.entries()) {
    const imageId = await storeFile(r.photo, actorId);
    const hasBio = r.bio_en || r.bio_ru || r.bio_uz;

    await prisma.experts.create({
      data: {
        type: ExpertType.INTERNATIONAL,
        fullName: trans(r.full_name_en, r.full_name_ru, r.full_name_uz),
        position: trans(r.position_en, r.position_ru, r.position_uz),
        bio: hasBio ? trans(r.bio_en, r.bio_ru, r.bio_uz) : Prisma.DbNull,
        imageId,
        email: r.email,
        phone: r.phone,
        order: index,
        createdById: actorId,
      },
    });
    count += 1;
  }

  const uzbek = await fetchData<UpstreamUzbekExpert[]>('uzbek-experts');
  for (const r of uzbek) {
    const imageId = await storeFile(r.image, actorId);
    const hasAbout = r.about_en || r.about_ru || r.about_uz;

    await prisma.experts.create({
      data: {
        type: ExpertType.UZBEK,
        fullName: trans(r.full_name_en, r.full_name_ru, r.full_name_uz),
        position: trans(r.position_en, r.position_ru, r.position_uz),
        bio: hasAbout ? trans(r.about_en, r.about_ru, r.about_uz) : Prisma.DbNull,
        imageId,
        order: r.order ?? 0,
        status: r.status ?? true,
        createdById: actorId,
      },
    });
    count += 1;
  }

  return count;
}

// ── Runner ──────────────────────────────────────────────────────────────────

const IMPORTERS: Record<string, (actorId: string | null) => Promise<number>> = {
  events: importEvents,
  news: importNews,
  council: importCouncil,
  testimonials: importTestimonials,
  blogs: importBlogs,
  experts: importExperts,
  reports: importReports,
  chronology: importChronology,
  'council-calendar': importCouncilCalendar,
  documents: importDocuments,
};

async function main(): Promise<void> {
  const requested = process.argv.slice(2).map((arg) => arg.toLowerCase());
  const names = requested.length > 0 ? requested : Object.keys(IMPORTERS);

  const unknown = names.filter((name) => !IMPORTERS[name]);
  if (unknown.length > 0) {
    throw new Error(
      `Unknown resource(s): ${unknown.join(', ')}. Valid: ${Object.keys(IMPORTERS).join(', ')}`,
    );
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const admin = await prisma.users.findFirst({
    where: { email: adminEmail, isDeleted: false },
    select: { id: true },
  });
  const actorId = admin?.id ?? null;

  console.log(`📥 Importing from ${BASE_URL}`);
  console.log(`🗂  Files: bucket "${BUCKET}", local copies in ${IMPORT_DIR} (named <fileId><ext>)`);
  console.log(
    `👤 Audit actor: ${actorId ? `${adminEmail} (${actorId})` : 'none (createdBy = null)'}\n`,
  );

  const summary: Record<string, number> = {};
  for (const name of names) {
    process.stdout.write(`• ${name} … `);
    try {
      summary[name] = await IMPORTERS[name](actorId);
      console.log(`done (${summary[name]} rows)`);
    } catch (error) {
      console.log(`FAILED: ${errMessage(error)}`);
    }
  }

  console.log('\n── Summary ─────────────────────────────');
  console.table(summary);
  console.log(`Files created: ${stats.files}, failed: ${stats.filesFailed}`);
  console.log('✅ Content seed completed.');
}

main()
  .catch((error) => {
    console.error('❌ Content seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
