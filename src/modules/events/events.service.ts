import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const EVENT_SELECT = {
  id: true,
  title: true,
  content: true,
  previewImageId: true,
  imageId: true,
  startDate: true,
  endDate: true,
  createdAt: true,
} satisfies Prisma.EventsSelect;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.EventsWhereInput = {
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
      sortBy && Object.keys(EVENT_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : { startDate: Prisma.SortOrder.desc };

    const [events, total] = await Promise.all([
      this.prisma.events.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: EVENT_SELECT,
        orderBy,
      }),
      this.prisma.events.count({ where }),
    ]);

    return paginate(events, total, page, limit);
  }

  async findById(id: string) {
    const event = await this.prisma.events.findUnique({
      where: { id, isDeleted: false },
      select: EVENT_SELECT,
    });

    if (!event) {
      throw new AppException(ErrorCodes.EVENT_NOT_FOUND, { details: { id } });
    }

    return event;
  }

  async create(dto: CreateEventDto, user: IUserSession) {
    const event = await this.prisma.events.create({
      data: {
        title: { ...dto.title },
        content: dto.content ? { ...dto.content } : Prisma.DbNull,
        previewImageId: dto.previewImageId,
        imageId: dto.imageId,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        createdById: user.id,
      },
      select: EVENT_SELECT,
    });

    return event;
  }

  async update(id: string, dto: UpdateEventDto, user: IUserSession) {
    const existing = await this.prisma.events.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.EVENT_NOT_FOUND, { details: { id } });
    }

    const event = await this.prisma.events.update({
      where: { id, isDeleted: false },
      data: {
        ...(dto.title ? { title: { ...dto.title } } : {}),
        ...(dto.content !== undefined
          ? { content: dto.content ? { ...dto.content } : Prisma.DbNull }
          : {}),
        previewImageId: dto.previewImageId,
        imageId: dto.imageId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        updatedById: user.id,
      },
      select: EVENT_SELECT,
    });

    return event;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.events.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.EVENT_NOT_FOUND, { details: { id } });
    }

    await this.prisma.events.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
