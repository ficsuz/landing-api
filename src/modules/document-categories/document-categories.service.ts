import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
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

const SORTABLE_FIELDS = ['slug', 'order', 'status', 'createdAt'];

@Injectable()
export class DocumentCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.DocumentCategoriesWhereInput = {
      isDeleted: false,
      ...(search
        ? {
            OR: [
              { slug: { contains: search, mode: 'insensitive' } },
              { name: { path: ['en'], string_contains: search } },
              { name: { path: ['ru'], string_contains: search } },
              { name: { path: ['uz'], string_contains: search } },
            ],
          }
        : {}),
    };

    const orderBy =
      sortBy && SORTABLE_FIELDS.includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }];

    const [categories, total] = await Promise.all([
      this.prisma.documentCategories.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: DOCUMENT_CATEGORY_SELECT,
        orderBy,
      }),
      this.prisma.documentCategories.count({ where }),
    ]);

    return paginate(categories, total, page, limit);
  }

  async findById(id: string) {
    const category = await this.prisma.documentCategories.findUnique({
      where: { id, isDeleted: false },
      select: DOCUMENT_CATEGORY_SELECT,
    });

    if (!category) {
      throw new AppException(ErrorCodes.DOCUMENT_CATEGORY_NOT_FOUND, { details: { id } });
    }

    return category;
  }

  async create(dto: CreateDocumentCategoryDto, user: IUserSession) {
    const category = await this.prisma.documentCategories.create({
      data: {
        name: { ...dto.name },
        slug: dto.slug,
        order: dto.order,
        status: dto.status,
        createdById: user.id,
      },
      select: DOCUMENT_CATEGORY_SELECT,
    });

    return category;
  }

  async update(id: string, dto: UpdateDocumentCategoryDto, user: IUserSession) {
    const existing = await this.prisma.documentCategories.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.DOCUMENT_CATEGORY_NOT_FOUND, { details: { id } });
    }

    const category = await this.prisma.documentCategories.update({
      where: { id, isDeleted: false },
      data: {
        ...(dto.name ? { name: { ...dto.name } } : {}),
        slug: dto.slug,
        order: dto.order,
        status: dto.status,
        updatedById: user.id,
      },
      select: DOCUMENT_CATEGORY_SELECT,
    });

    return category;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.documentCategories.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.DOCUMENT_CATEGORY_NOT_FOUND, { details: { id } });
    }

    // Block deletion while documents still reference this category.
    const inUse = await this.prisma.documents.count({
      where: { categoryId: id, isDeleted: false },
    });
    if (inUse > 0) {
      throw new AppException(ErrorCodes.DOCUMENT_CATEGORY_IN_USE, {
        details: { id, count: inUse },
      });
    }

    await this.prisma.documentCategories.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
