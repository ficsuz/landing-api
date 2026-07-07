import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

const TEAM_MEMBER_SELECT = {
  id: true,
  fullName: true,
  position: true,
  bio: true,
  photoId: true,
  email: true,
  phone: true,
  order: true,
  status: true,
  createdAt: true,
} satisfies Prisma.TeamMembersSelect;

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: IPagination) {
    const { limit, page, search, sortBy, order } = query;

    const where: Prisma.TeamMembersWhereInput = {
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
      sortBy && Object.keys(TEAM_MEMBER_SELECT).includes(sortBy)
        ? { [sortBy]: order }
        : [{ order: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }];

    const [members, total] = await Promise.all([
      this.prisma.teamMembers.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: TEAM_MEMBER_SELECT,
        orderBy,
      }),
      this.prisma.teamMembers.count({ where }),
    ]);

    return paginate(members, total, page, limit);
  }

  async findById(id: string) {
    const member = await this.prisma.teamMembers.findUnique({
      where: { id, isDeleted: false },
      select: TEAM_MEMBER_SELECT,
    });

    if (!member) {
      throw new AppException(ErrorCodes.TEAM_MEMBER_NOT_FOUND, { details: { id } });
    }

    return member;
  }

  async create(dto: CreateTeamMemberDto, user: IUserSession) {
    const member = await this.prisma.teamMembers.create({
      data: {
        fullName: { ...dto.fullName },
        position: { ...dto.position },
        bio: dto.bio ? { ...dto.bio } : Prisma.DbNull,
        photoId: dto.photoId,
        email: dto.email,
        phone: dto.phone,
        order: dto.order,
        status: dto.status,
        createdById: user.id,
      },
      select: TEAM_MEMBER_SELECT,
    });

    return member;
  }

  async update(id: string, dto: UpdateTeamMemberDto, user: IUserSession) {
    const existing = await this.prisma.teamMembers.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.TEAM_MEMBER_NOT_FOUND, { details: { id } });
    }

    const member = await this.prisma.teamMembers.update({
      where: { id, isDeleted: false },
      data: {
        fullName: dto.fullName ? { ...dto.fullName } : undefined,
        position: dto.position ? { ...dto.position } : undefined,
        ...(dto.bio !== undefined ? { bio: dto.bio ? { ...dto.bio } : Prisma.DbNull } : {}),
        photoId: dto.photoId,
        email: dto.email,
        phone: dto.phone,
        order: dto.order,
        status: dto.status,
        updatedById: user.id,
      },
      select: TEAM_MEMBER_SELECT,
    });

    return member;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existing = await this.prisma.teamMembers.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new AppException(ErrorCodes.TEAM_MEMBER_NOT_FOUND, { details: { id } });
    }

    await this.prisma.teamMembers.update({
      where: { id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
    });
  }
}
