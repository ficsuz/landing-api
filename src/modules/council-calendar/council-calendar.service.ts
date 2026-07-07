import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateCouncilCalendarDto } from './dto/create-council-calendar.dto';
import { UpdateCouncilCalendarDto } from './dto/update-council-calendar.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const COUNCIL_CALENDAR_SELECT = {
  id: true,
  title: true,
  description: true,
  date: true,
  order: true,
  status: true,
  createdAt: true,
} satisfies Prisma.CouncilCalendarSelect;

@Injectable()
export class CouncilCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.CouncilCalendarWhereInput = {
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

    // The calendar reads chronologically: explicit `order` first, then by date.
    const orderBy =
      sortBy && Object.keys(COUNCIL_CALENDAR_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { date: Prisma.SortOrder.asc }];

    const [entries, total] = await Promise.all([
      this.prisma.councilCalendar.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: COUNCIL_CALENDAR_SELECT,
        orderBy,
      }),
      this.prisma.councilCalendar.count({ where }),
    ]);

    return paginate(entries, total, page, limit);
  }

  async findById(id: string) {
    const entry = await this.prisma.councilCalendar.findUnique({
      where: { id, isDeleted: false },
      select: COUNCIL_CALENDAR_SELECT,
    });

    if (!entry) {
      throw new AppException(ErrorCodes.COUNCIL_CALENDAR_NOT_FOUND, { details: { id } });
    }

    return entry;
  }

  async create(dto: CreateCouncilCalendarDto, user: IUserSession) {
    const entry = await this.prisma.councilCalendar.create({
      data: {
        title: { ...dto.title },
        description: dto.description ? { ...dto.description } : Prisma.DbNull,
        date: dto.date ? new Date(dto.date) : null,
        order: dto.order,
        status: dto.status,
        createdById: user.id,
      },
      select: COUNCIL_CALENDAR_SELECT,
    });

    return entry;
  }

  async update(id: string, dto: UpdateCouncilCalendarDto, user: IUserSession) {
    const existing = await this.prisma.councilCalendar.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.COUNCIL_CALENDAR_NOT_FOUND, { details: { id } });
    }

    const entry = await this.prisma.councilCalendar.update({
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
      select: COUNCIL_CALENDAR_SELECT,
    });

    return entry;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.councilCalendar.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.COUNCIL_CALENDAR_NOT_FOUND, { details: { id } });
    }

    await this.prisma.councilCalendar.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
