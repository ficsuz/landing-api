import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateCouncilMemberDto } from './dto/create-council-member.dto';
import { UpdateCouncilMemberDto } from './dto/update-council-member.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const COUNCIL_SELECT = {
  id: true,
  fullName: true,
  position: true,
  photoId: true,
  order: true,
  createdAt: true,
} satisfies Prisma.CouncilSelect;

@Injectable()
export class CouncilService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.CouncilWhereInput = {
      isDeleted: false,
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
      sortBy && Object.keys(COUNCIL_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }];

    const [members, total] = await Promise.all([
      this.prisma.council.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: COUNCIL_SELECT,
        orderBy,
      }),
      this.prisma.council.count({ where }),
    ]);

    return paginate(members, total, page, limit);
  }

  async findById(id: string) {
    const member = await this.prisma.council.findUnique({
      where: { id, isDeleted: false },
      select: COUNCIL_SELECT,
    });

    if (!member) {
      throw new AppException(ErrorCodes.COUNCIL_MEMBER_NOT_FOUND, { details: { id } });
    }

    return member;
  }

  async create(dto: CreateCouncilMemberDto, user: IUserSession) {
    const member = await this.prisma.council.create({
      data: {
        fullName: { ...dto.fullName },
        position: { ...dto.position },
        photoId: dto.photoId,
        order: dto.order,
        createdById: user.id,
      },
      select: COUNCIL_SELECT,
    });

    return member;
  }

  async update(id: string, dto: UpdateCouncilMemberDto, user: IUserSession) {
    const existing = await this.prisma.council.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.COUNCIL_MEMBER_NOT_FOUND, { details: { id } });
    }

    const member = await this.prisma.council.update({
      where: { id, isDeleted: false },
      data: {
        ...(dto.fullName ? { fullName: { ...dto.fullName } } : {}),
        ...(dto.position ? { position: { ...dto.position } } : {}),
        photoId: dto.photoId,
        order: dto.order,
        updatedById: user.id,
      },
      select: COUNCIL_SELECT,
    });

    return member;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.council.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.COUNCIL_MEMBER_NOT_FOUND, { details: { id } });
    }

    await this.prisma.council.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
