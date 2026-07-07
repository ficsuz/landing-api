import { Injectable } from '@nestjs/common';
import { MemberType, Prisma } from '@prisma/client';

import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberQueryDto } from './dto/member-query.dto';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const MEMBER_SELECT = {
  id: true,
  name: true,
  description: true,
  logoId: true,
  link: true,
  type: true,
  order: true,
  status: true,
  createdAt: true,
} satisfies Prisma.MembersSelect;

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: MemberQueryDto) {
    const { limit, page, search, sortBy, order, type } = query;

    const where: Prisma.MembersWhereInput = {
      isDeleted: false,
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { name: { path: ['en'], string_contains: search } },
              { name: { path: ['ru'], string_contains: search } },
              { name: { path: ['uz'], string_contains: search } },
            ],
          }
        : {}),
    };

    const orderBy =
      sortBy && Object.keys(MEMBER_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }];

    const [members, total] = await Promise.all([
      this.prisma.members.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: MEMBER_SELECT,
        orderBy,
      }),
      this.prisma.members.count({ where }),
    ]);

    return paginate(members, total, page, limit);
  }

  async findById(id: string) {
    const member = await this.prisma.members.findUnique({
      where: { id, isDeleted: false },
      select: MEMBER_SELECT,
    });

    if (!member) {
      throw new AppException(ErrorCodes.MEMBER_NOT_FOUND, { details: { id } });
    }

    return member;
  }

  async create(dto: CreateMemberDto, user: IUserSession) {
    const member = await this.prisma.members.create({
      data: {
        name: { ...dto.name },
        description: dto.description ? { ...dto.description } : Prisma.DbNull,
        logoId: dto.logoId,
        link: dto.link,
        type: dto.type ?? MemberType.FULL,
        order: dto.order,
        status: dto.status,
        createdById: user.id,
      },
      select: MEMBER_SELECT,
    });

    return member;
  }

  async update(id: string, dto: UpdateMemberDto, user: IUserSession) {
    const existing = await this.prisma.members.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.MEMBER_NOT_FOUND, { details: { id } });
    }

    const member = await this.prisma.members.update({
      where: { id, isDeleted: false },
      data: {
        name: dto.name ? { ...dto.name } : undefined,
        ...(dto.description !== undefined
          ? { description: dto.description ? { ...dto.description } : Prisma.DbNull }
          : {}),
        logoId: dto.logoId,
        link: dto.link,
        type: dto.type,
        order: dto.order,
        status: dto.status,
        updatedById: user.id,
      },
      select: MEMBER_SELECT,
    });

    return member;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.members.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.MEMBER_NOT_FOUND, { details: { id } });
    }

    await this.prisma.members.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
