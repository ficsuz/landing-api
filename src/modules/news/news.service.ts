import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const NEWS_SELECT = {
  id: true,
  title: true,
  content: true,
  imageId: true,
  date: true,
  status: true,
  otherLink: true,
  createdAt: true,
} satisfies Prisma.NewsSelect;

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.NewsWhereInput = {
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
      sortBy && Object.keys(NEWS_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : { date: Prisma.SortOrder.desc };

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: NEWS_SELECT,
        orderBy,
      }),
      this.prisma.news.count({ where }),
    ]);

    return paginate(news, total, page, limit);
  }

  async findById(id: string) {
    const article = await this.prisma.news.findUnique({
      where: { id, isDeleted: false },
      select: NEWS_SELECT,
    });

    if (!article) {
      throw new AppException(ErrorCodes.NEWS_NOT_FOUND, { details: { id } });
    }

    return article;
  }

  async create(dto: CreateNewsDto, user: IUserSession) {
    const article = await this.prisma.news.create({
      data: {
        title: { ...dto.title },
        content: dto.content ? { ...dto.content } : Prisma.DbNull,
        imageId: dto.imageId,
        date: dto.date ? new Date(dto.date) : null,
        status: dto.status,
        otherLink: dto.otherLink,
        createdById: user.id,
      },
      select: NEWS_SELECT,
    });

    return article;
  }

  async update(id: string, dto: UpdateNewsDto, user: IUserSession) {
    const existing = await this.prisma.news.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.NEWS_NOT_FOUND, { details: { id } });
    }

    const article = await this.prisma.news.update({
      where: { id, isDeleted: false },
      data: {
        ...(dto.title ? { title: { ...dto.title } } : {}),
        ...(dto.content !== undefined
          ? { content: dto.content ? { ...dto.content } : Prisma.DbNull }
          : {}),
        imageId: dto.imageId,
        date: dto.date ? new Date(dto.date) : undefined,
        status: dto.status,
        otherLink: dto.otherLink,
        updatedById: user.id,
      },
      select: NEWS_SELECT,
    });

    return article;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.news.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.NEWS_NOT_FOUND, { details: { id } });
    }

    await this.prisma.news.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
