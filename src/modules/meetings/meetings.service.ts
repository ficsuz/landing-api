import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const MEETING_SELECT = {
  id: true,
  title: true,
  content: true,
  subject: true,
  imageId: true,
  imageIds: true,
  date: true,
  status: true,
  createdAt: true,
} satisfies Prisma.MeetingsSelect;

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.MeetingsWhereInput = {
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
      sortBy && Object.keys(MEETING_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : { date: Prisma.SortOrder.desc };

    const [meetings, total] = await Promise.all([
      this.prisma.meetings.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: MEETING_SELECT,
        orderBy,
      }),
      this.prisma.meetings.count({ where }),
    ]);

    return paginate(meetings, total, page, limit);
  }

  async findById(id: string) {
    const meeting = await this.prisma.meetings.findUnique({
      where: { id, isDeleted: false },
      select: MEETING_SELECT,
    });

    if (!meeting) {
      throw new AppException(ErrorCodes.MEETING_NOT_FOUND, { details: { id } });
    }

    return meeting;
  }

  async create(dto: CreateMeetingDto, user: IUserSession) {
    const meeting = await this.prisma.meetings.create({
      data: {
        title: { ...dto.title },
        content: dto.content ? { ...dto.content } : Prisma.DbNull,
        subject: dto.subject ? { ...dto.subject } : Prisma.DbNull,
        imageId: dto.imageId,
        imageIds: dto.imageIds,
        date: dto.date ? new Date(dto.date) : null,
        status: dto.status,
        createdById: user.id,
      },
      select: MEETING_SELECT,
    });

    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto, user: IUserSession) {
    const existing = await this.prisma.meetings.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.MEETING_NOT_FOUND, { details: { id } });
    }

    const meeting = await this.prisma.meetings.update({
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
        imageIds: dto.imageIds,
        date: dto.date ? new Date(dto.date) : undefined,
        status: dto.status,
        updatedById: user.id,
      },
      select: MEETING_SELECT,
    });

    return meeting;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.meetings.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.MEETING_NOT_FOUND, { details: { id } });
    }

    await this.prisma.meetings.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
