import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateChronologyDto } from './dto/create-chronology.dto';
import { UpdateChronologyDto } from './dto/update-chronology.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const CHRONOLOGY_SELECT = {
  id: true,
  title: true,
  description: true,
  date: true,
  order: true,
  status: true,
  createdAt: true,
} satisfies Prisma.ChronologySelect;

@Injectable()
export class ChronologyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.ChronologyWhereInput = {
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

    // The timeline reads chronologically: explicit `order` first, then by date.
    const orderBy =
      sortBy && Object.keys(CHRONOLOGY_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { date: Prisma.SortOrder.asc }];

    const [milestones, total] = await Promise.all([
      this.prisma.chronology.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: CHRONOLOGY_SELECT,
        orderBy,
      }),
      this.prisma.chronology.count({ where }),
    ]);

    return paginate(milestones, total, page, limit);
  }

  async findById(id: string) {
    const milestone = await this.prisma.chronology.findUnique({
      where: { id, isDeleted: false },
      select: CHRONOLOGY_SELECT,
    });

    if (!milestone) {
      throw new AppException(ErrorCodes.CHRONOLOGY_NOT_FOUND, { details: { id } });
    }

    return milestone;
  }

  async create(dto: CreateChronologyDto, user: IUserSession) {
    const milestone = await this.prisma.chronology.create({
      data: {
        title: { ...dto.title },
        description: dto.description ? { ...dto.description } : Prisma.DbNull,
        date: dto.date ? new Date(dto.date) : null,
        order: dto.order,
        status: dto.status,
        createdById: user.id,
      },
      select: CHRONOLOGY_SELECT,
    });

    return milestone;
  }

  async update(id: string, dto: UpdateChronologyDto, user: IUserSession) {
    const existing = await this.prisma.chronology.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.CHRONOLOGY_NOT_FOUND, { details: { id } });
    }

    const milestone = await this.prisma.chronology.update({
      where: { id, isDeleted: false },
      data: {
        ...(dto.title ? { title: { ...dto.title } } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description ? { ...dto.description } : Prisma.DbNull }
          : {}),
        date: dto.date ? new Date(dto.date) : undefined,
        order: dto.order,
        status: dto.status,
        updatedById: user.id,
      },
      select: CHRONOLOGY_SELECT,
    });

    return milestone;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.chronology.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.CHRONOLOGY_NOT_FOUND, { details: { id } });
    }

    await this.prisma.chronology.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
