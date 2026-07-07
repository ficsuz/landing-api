import { Injectable } from '@nestjs/common';
import { ExpertType, Prisma } from '@prisma/client';

import { CreateExpertDto } from './dto/create-expert.dto';
import { UpdateExpertDto } from './dto/update-expert.dto';
import { ExpertQueryDto } from './dto/expert-query.dto';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const EXPERT_SELECT = {
  id: true,
  type: true,
  fullName: true,
  position: true,
  bio: true,
  imageId: true,
  email: true,
  phone: true,
  order: true,
  status: true,
  createdAt: true,
} satisfies Prisma.ExpertsSelect;

@Injectable()
export class ExpertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ExpertQueryDto) {
    const { limit, page, search, sortBy, order, type } = query;

    const where: Prisma.ExpertsWhereInput = {
      isDeleted: false,
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { path: ['en'], string_contains: search } },
              { fullName: { path: ['ru'], string_contains: search } },
              { fullName: { path: ['uz'], string_contains: search } },
            ],
          }
        : {}),
    };

    const orderBy =
      sortBy && Object.keys(EXPERT_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }];

    const [experts, total] = await Promise.all([
      this.prisma.experts.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: EXPERT_SELECT,
        orderBy,
      }),
      this.prisma.experts.count({ where }),
    ]);

    return paginate(experts, total, page, limit);
  }

  async findById(id: string) {
    const expert = await this.prisma.experts.findUnique({
      where: { id, isDeleted: false },
      select: EXPERT_SELECT,
    });

    if (!expert) {
      throw new AppException(ErrorCodes.EXPERT_NOT_FOUND, { details: { id } });
    }

    return expert;
  }

  async create(dto: CreateExpertDto, user: IUserSession) {
    const expert = await this.prisma.experts.create({
      data: {
        type: dto.type ?? ExpertType.INTERNATIONAL,
        fullName: { ...dto.fullName },
        position: { ...dto.position },
        bio: dto.bio ? { ...dto.bio } : Prisma.DbNull,
        imageId: dto.imageId,
        email: dto.email,
        phone: dto.phone,
        order: dto.order,
        status: dto.status,
        createdById: user.id,
      },
      select: EXPERT_SELECT,
    });

    return expert;
  }

  async update(id: string, dto: UpdateExpertDto, user: IUserSession) {
    const existing = await this.prisma.experts.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.EXPERT_NOT_FOUND, { details: { id } });
    }

    const expert = await this.prisma.experts.update({
      where: { id, isDeleted: false },
      data: {
        type: dto.type,
        fullName: dto.fullName ? { ...dto.fullName } : undefined,
        position: dto.position ? { ...dto.position } : undefined,
        ...(dto.bio !== undefined ? { bio: dto.bio ? { ...dto.bio } : Prisma.DbNull } : {}),
        imageId: dto.imageId,
        email: dto.email,
        phone: dto.phone,
        order: dto.order,
        status: dto.status,
        updatedById: user.id,
      },
      select: EXPERT_SELECT,
    });

    return expert;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.experts.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.EXPERT_NOT_FOUND, { details: { id } });
    }

    await this.prisma.experts.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
