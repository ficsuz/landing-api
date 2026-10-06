import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { extname } from 'path';
import { Readable } from 'stream';
import * as sharp from 'sharp';
import { Files } from '@prisma/client';

import { BufferedFile } from './interfaces/file.interface';
import { FileResponseDto } from './dto/file-response.dto';
import { GetFileQueryDto } from './dto/get-file-query.dto';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { MinioClientService } from '@common/services/minio/minio.service';
import { EnvService } from '@common/services/env/env.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';

const MAX_FILE_SIZE_MB = 40;

// Uploaded photos often come straight from a camera (6000+ px, several MB).
// Scale them down to this longest side — wider than any slot on the site.
const MAX_IMAGE_DIMENSION = 2000;
const OPTIMIZABLE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly minio: MinioClientService,
  ) {}

  async upload(file: BufferedFile, user: IUserSession): Promise<FileResponseDto> {
    if ((file.buffer as Buffer).length / 1_000_000 > MAX_FILE_SIZE_MB) {
      throw new AppException(ErrorCodes.FILE_TOO_LARGE, {
        args: { limit: `${MAX_FILE_SIZE_MB}MB` },
      });
    }
    const fileBuffer = await this.optimizeImage(file.buffer as Buffer, file.mimetype);

    const bucketName = this.env.get('MINIO_BUCKET');

    // Create the DB row first so its id can seed a unique object key.
    const record = await this.prisma.files.create({
      data: {
        bucketName,
        createdById: user.id,
        type: file.mimetype,
        name: file.originalname,
        size: fileBuffer.length,
      },
      select: { id: true, name: true, type: true, size: true, bucketName: true, createdAt: true },
    });

    const objectName = `${record.id}${extname(file.originalname)}`;

    try {
      await this.minio.upload(bucketName, objectName, fileBuffer);
    } catch (error) {
      // Roll back the DB row if the object store write fails.
      await this.prisma.files.delete({ where: { id: record.id } });
      throw new AppException(ErrorCodes.FILE_UPLOAD_FAILED, { cause: error });
    }

    // Persist the object key so reads never have to recompute it.
    await this.prisma.files.update({ where: { id: record.id }, data: { path: objectName } });

    return record;
  }

  /**
   * Upload several files in one request. Each file goes through the same
   * single-upload path (size check + DB row + object-store write); results are
   * returned in the original field order.
   */
  uploadMany(files: BufferedFile[], user: IUserSession): Promise<FileResponseDto[]> {
    if (!files?.length) {
      throw new AppException(ErrorCodes.BAD_REQUEST, { details: { field: 'files' } });
    }

    return Promise.all(files.map((file) => this.upload(file, user)));
  }

  /**
   * Stream a stored file. `query.download === true` delivers it as an attachment
   * (and logs the download); otherwise it is served inline so browsers can
   * render it. Returns a `StreamableFile` so the controller stays a thin
   * delegate — NestJS sets the Content-Type/Disposition/Length from its options.
   */
  async getFile(
    fileId: string,
    query: GetFileQueryDto,
    user?: IUserSession,
    ip?: string,
  ): Promise<StreamableFile> {
    const file = await this.prisma.files.findUnique({
      where: { id: fileId, isDeleted: false },
    });

    if (!file) {
      throw new AppException(ErrorCodes.FILE_NOT_FOUND);
    }

    // Content-Length comes from the stored object, not files.size: objects may be
    // recompressed in place after upload, and a stale length breaks the response.
    let size: number;
    let stream: Readable;
    try {
      const objectName = this.objectName(file);
      ({ size } = await this.minio.getObjectInfo(objectName, file.bucketName));
      stream = await this.minio.getObjectStream(objectName, file.bucketName);
    } catch (error) {
      // The object store already maps a missing object to FILE_NOT_FOUND (404);
      // preserve that (and any other domain error) instead of masking it as a 500.
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(ErrorCodes.FILE_FETCH_FAILED, { cause: error });
    }

    const download = query.download ?? false;

    // Record genuine downloads (not inline views) in the access log. The route
    // is public — anonymous downloads log with a null user.
    if (download) {
      this.recordDownload(file.id, user?.id, ip);
    }

    const disposition =
      `${download ? 'attachment' : 'inline'}; ` +
      `filename*=UTF-8''${encodeURIComponent(file.name)}`;

    return new StreamableFile(stream, { type: file.type, disposition, length: size });
  }

  /**
   * Downscale and recompress a JPEG/PNG/WebP upload, keeping its format (so the
   * stored extension and MIME type stay valid). Anything else, or a result that
   * isn't smaller, is stored untouched; an optimization failure never fails the
   * upload. `rotate()` bakes in the EXIF orientation, and re-encoding drops the
   * rest of the metadata (camera, GPS).
   */
  private async optimizeImage(buffer: Buffer, mimetype: string): Promise<Buffer> {
    if (!OPTIMIZABLE_IMAGE_TYPES.has(mimetype)) {
      return buffer;
    }
    try {
      const image = sharp(buffer, { failOn: 'none' })
        .rotate()
        .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      const optimized =
        mimetype === 'image/png'
          ? await image.png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer()
          : mimetype === 'image/webp'
            ? await image.webp({ quality: 82 }).toBuffer()
            : await image.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      return optimized.length < buffer.length ? optimized : buffer;
    } catch (error) {
      this.logger.warn(
        `Image optimization skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
      return buffer;
    }
  }

  /** Object key for a stored file: the persisted `path`, or derived for old rows. */
  private objectName(file: Pick<Files, 'id' | 'name' | 'path'>): string {
    return file.path ?? `${file.id}${extname(file.name)}`;
  }

  /** Best-effort append to the download log — never blocks or fails the stream. */
  private recordDownload(fileId: string, userId?: string, ipAddress?: string): void {
    void this.prisma.downloadHistory
      .create({ data: { fileId, userId, ipAddress } })
      .catch((error) =>
        this.logger.error(
          `Failed to record download for file ${fileId}`,
          error instanceof Error ? error.stack : String(error),
        ),
      );
  }
}
