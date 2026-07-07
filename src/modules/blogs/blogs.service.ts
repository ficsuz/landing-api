import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const BLOG_SELECT = {
  id: true,
  title: true,
  content: true,
  subject: true,
  imageId: true,
  date: true,
  status: true,
  createdAt: true,
} satisfies Prisma.BlogsSelect;

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.BlogsWhereInput = {
      isDeleted: false,
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
      sortBy && Object.keys(BLOG_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : { date: Prisma.SortOrder.desc };

    const [blogs, total] = await Promise.all([
      this.prisma.blogs.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: BLOG_SELECT,
        orderBy,
      }),
      this.prisma.blogs.count({ where }),
    ]);

    return paginate(blogs, total, page, limit);
  }

  async findById(id: string) {
    const blog = await this.prisma.blogs.findUnique({
      where: { id, isDeleted: false },
      select: BLOG_SELECT,
    });

    if (!blog) {
      throw new AppException(ErrorCodes.BLOG_NOT_FOUND, { details: { id } });
    }

    return blog;
  }

  async create(dto: CreateBlogDto, user: IUserSession) {
    const blog = await this.prisma.blogs.create({
      data: {
        title: { ...dto.title },
        content: dto.content ? { ...dto.content } : Prisma.DbNull,
        subject: dto.subject ? { ...dto.subject } : Prisma.DbNull,
        imageId: dto.imageId,
        date: dto.date ? new Date(dto.date) : null,
        status: dto.status,
        createdById: user.id,
      },
      select: BLOG_SELECT,
    });

    return blog;
  }

  async update(id: string, dto: UpdateBlogDto, user: IUserSession) {
    const existing = await this.prisma.blogs.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.BLOG_NOT_FOUND, { details: { id } });
    }

    const blog = await this.prisma.blogs.update({
      where: { id, isDeleted: false },
      data: {
        ...(dto.title ? { title: { ...dto.title } } : {}),
        ...(dto.content !== undefined
          ? { content: dto.content ? { ...dto.content } : Prisma.DbNull }
          : {}),
        ...(dto.subject !== undefined
          ? { subject: dto.subject ? { ...dto.subject } : Prisma.DbNull }
          : {}),
        imageId: dto.imageId,
        date: dto.date ? new Date(dto.date) : undefined,
        status: dto.status,
        updatedById: user.id,
      },
      select: BLOG_SELECT,
    });

    return blog;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.blogs.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.BLOG_NOT_FOUND, { details: { id } });
    }

    await this.prisma.blogs.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
