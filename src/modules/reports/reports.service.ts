import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const REPORT_SELECT = {
  id: true,
  title: true,
  description: true,
  previewImageId: true,
  fileId: true,
  date: true,
  status: true,
  createdAt: true,
} satisfies Prisma.ReportsSelect;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.ReportsWhereInput = {
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
      sortBy && Object.keys(REPORT_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : { date: Prisma.SortOrder.desc };

    const [reports, total] = await Promise.all([
      this.prisma.reports.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: REPORT_SELECT,
        orderBy,
      }),
      this.prisma.reports.count({ where }),
    ]);

    return paginate(reports, total, page, limit);
  }

  async findById(id: string) {
    const report = await this.prisma.reports.findUnique({
      where: { id, isDeleted: false },
      select: REPORT_SELECT,
    });

    if (!report) {
      throw new AppException(ErrorCodes.REPORT_NOT_FOUND, { details: { id } });
    }

    return report;
  }

  async create(dto: CreateReportDto, user: IUserSession) {
    const report = await this.prisma.reports.create({
      data: {
        title: { ...dto.title },
        description: dto.description ? { ...dto.description } : Prisma.DbNull,
        previewImageId: dto.previewImageId,
        fileId: dto.fileId,
        date: dto.date ? new Date(dto.date) : null,
        status: dto.status,
        createdById: user.id,
      },
      select: REPORT_SELECT,
    });

    return report;
  }

  async update(id: string, dto: UpdateReportDto, user: IUserSession) {
    const existing = await this.prisma.reports.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.REPORT_NOT_FOUND, { details: { id } });
    }

    const report = await this.prisma.reports.update({
      where: { id, isDeleted: false },
      data: {
        ...(dto.title ? { title: { ...dto.title } } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description ? { ...dto.description } : Prisma.DbNull }
          : {}),
        previewImageId: dto.previewImageId,
        fileId: dto.fileId,
        date: dto.date ? new Date(dto.date) : undefined,
        status: dto.status,
        updatedById: user.id,
      },
      select: REPORT_SELECT,
    });

    return report;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.reports.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.REPORT_NOT_FOUND, { details: { id } });
    }

    await this.prisma.reports.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
