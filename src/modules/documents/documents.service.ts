import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentQueryDto } from './dto/document-query.dto';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const DOCUMENT_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  order: true,
  status: true,
  createdAt: true,
} satisfies Prisma.DocumentCategoriesSelect;

const DOCUMENT_SELECT = {
  id: true,
  categoryId: true,
  category: { select: DOCUMENT_CATEGORY_SELECT },
  title: true,
  fileId: true,
  date: true,
  order: true,
  status: true,
  createdAt: true,
} satisfies Prisma.DocumentsSelect;

// Scalar columns the client may sort by (the `category` relation is not sortable).
const SORTABLE_FIELDS = ['date', 'order', 'status', 'createdAt'];

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: DocumentQueryDto) {
    const { limit, page, search, sortBy, order, categoryId } = query;

    const where: Prisma.DocumentsWhereInput = {
      isDeleted: false,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { title: { path: ['en'], string_contains: search } },
              { title: { path: ['ru'], string_contains: search } },
              { title: { path: ['uz'], string_contains: search } },
            ],
          }
        : {}),
    };

    const orderBy =
      sortBy && SORTABLE_FIELDS.includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }];

    const [documents, total] = await Promise.all([
      this.prisma.documents.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: DOCUMENT_SELECT,
        orderBy,
      }),
      this.prisma.documents.count({ where }),
    ]);

    return paginate(documents, total, page, limit);
  }

  async findById(id: string) {
    const document = await this.prisma.documents.findUnique({
      where: { id, isDeleted: false },
      select: DOCUMENT_SELECT,
    });

    if (!document) {
      throw new AppException(ErrorCodes.DOCUMENT_NOT_FOUND, { details: { id } });
    }

    return document;
  }

  async create(dto: CreateDocumentDto, user: IUserSession) {
    await this.assertCategoryExists(dto.categoryId);

    const document = await this.prisma.documents.create({
      data: {
        categoryId: dto.categoryId,
        title: { ...dto.title },
        fileId: dto.fileId,
        date: dto.date ? new Date(dto.date) : null,
        order: dto.order,
        status: dto.status,
        createdById: user.id,
      },
      select: DOCUMENT_SELECT,
    });

    return document;
  }

  async update(id: string, dto: UpdateDocumentDto, user: IUserSession) {
    const existing = await this.prisma.documents.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.DOCUMENT_NOT_FOUND, { details: { id } });
    }

    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }

    const document = await this.prisma.documents.update({
      where: { id, isDeleted: false },
      data: {
        categoryId: dto.categoryId,
        ...(dto.title ? { title: { ...dto.title } } : {}),
        fileId: dto.fileId,
        date: dto.date ? new Date(dto.date) : undefined,
        order: dto.order,
        status: dto.status,
        updatedById: user.id,
      },
      select: DOCUMENT_SELECT,
    });

    return document;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.documents.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.DOCUMENT_NOT_FOUND, { details: { id } });
    }

    await this.prisma.documents.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }

  // The category must exist (and not be soft-deleted) before a document can
  // reference it — yields a clear domain error instead of a raw FK violation.
  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.documentCategories.findUnique({
      where: { id: categoryId, isDeleted: false },
      select: { id: true },
    });

    if (!category) {
      throw new AppException(ErrorCodes.DOCUMENT_CATEGORY_NOT_FOUND, {
        details: { id: categoryId },
      });
    }
  }
}
