import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateSpecialProjectDto } from './dto/create-special-project.dto';
import { UpdateSpecialProjectDto } from './dto/update-special-project.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const SPECIAL_PROJECT_SELECT = {
  id: true,
  title: true,
  link: true,
  order: true,
  status: true,
  createdAt: true,
} satisfies Prisma.SpecialProjectsSelect;

@Injectable()
export class SpecialProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.SpecialProjectsWhereInput = {
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
      sortBy && Object.keys(SPECIAL_PROJECT_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }];

    const [specialProjects, total] = await Promise.all([
      this.prisma.specialProjects.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: SPECIAL_PROJECT_SELECT,
        orderBy,
      }),
      this.prisma.specialProjects.count({ where }),
    ]);

    return paginate(specialProjects, total, page, limit);
  }

  async findById(id: string) {
    const specialProject = await this.prisma.specialProjects.findUnique({
      where: { id, isDeleted: false },
      select: SPECIAL_PROJECT_SELECT,
    });

    if (!specialProject) {
      throw new AppException(ErrorCodes.SPECIAL_PROJECT_NOT_FOUND, { details: { id } });
    }

    return specialProject;
  }

  async create(dto: CreateSpecialProjectDto, user: IUserSession) {
    const specialProject = await this.prisma.specialProjects.create({
      data: {
        title: { ...dto.title },
        link: dto.link,
        order: dto.order,
        status: dto.status,
        createdById: user.id,
      },
      select: SPECIAL_PROJECT_SELECT,
    });

    return specialProject;
  }

  async update(id: string, dto: UpdateSpecialProjectDto, user: IUserSession) {
    const existing = await this.prisma.specialProjects.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.SPECIAL_PROJECT_NOT_FOUND, { details: { id } });
    }

    const specialProject = await this.prisma.specialProjects.update({
      where: { id, isDeleted: false },
      data: {
        title: dto.title ? { ...dto.title } : undefined,
        link: dto.link,
        order: dto.order,
        status: dto.status,
        updatedById: user.id,
      },
      select: SPECIAL_PROJECT_SELECT,
    });

    return specialProject;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.specialProjects.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.SPECIAL_PROJECT_NOT_FOUND, { details: { id } });
    }

    await this.prisma.specialProjects.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
