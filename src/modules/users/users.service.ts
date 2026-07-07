import { Injectable } from '@nestjs/common';

import { ICreateUserDto, IUpdateUserDto } from './interfaces/user.interface';
import { IPagination } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(payload: IPagination) {
    const { limit, page, search, sortBy, order } = payload;

    const select = {
      id: true,
      fullName: true,
      email: true,
      isVerified: true,
      createdAt: true,
    };

    // Build the search condition
    const where: Prisma.UsersWhereInput = {
      isDeleted: false,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const sort = Object.keys(select).includes(sortBy) && sortBy ? { [sortBy]: order } : {};

    // Fetch paginated users
    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select,
        orderBy: sort,
      }),
      this.prisma.users.count({ where }),
    ]);

    return paginate(users, total, page, limit);
  }

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppException(ErrorCodes.USER_NOT_FOUND, { details: { id } });
    }

    const { userRoles, ...rest } = user;
    const roles = userRoles.map(({ role }) => role);

    return {
      ...rest,
      roles,
    };
  }

  async create(data: ICreateUserDto) {
    // Check email uniqueness
    const existingUser = await this.prisma.users.findFirst({
      where: { email: data.email, isDeleted: false },
    });

    if (existingUser) {
      throw new AppException(ErrorCodes.USER_EMAIL_EXISTS);
    }

    const user = await this.prisma.users.create({
      data: {
        ...data,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
        createdAt: true,
      },
    });
    return user;
  }

  async update(id: string, data: IUpdateUserDto, currentUser: IUserSession) {
    // Check if user exists
    const existingUser = await this.prisma.users.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existingUser) {
      throw new AppException(ErrorCodes.USER_NOT_FOUND, { details: { id } });
    }

    // Check email uniqueness if email is being updated
    if (data.email) {
      const emailUser = await this.prisma.users.findUnique({
        where: { email: data.email, isDeleted: false },
      });

      if (emailUser && emailUser.id !== id) {
        throw new AppException(ErrorCodes.USER_EMAIL_EXISTS);
      }
    }

    const user = await this.prisma.users.update({
      where: { id, isDeleted: false },
      data: {
        ...data,
        updatedById: currentUser.id,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
        createdAt: true,
      },
    });
    return user;
  }

  async delete(id: string, currentUser: IUserSession): Promise<void> {
    // Check if user exists
    const exists = await this.prisma.users.findUnique({
      where: { id, isDeleted: false },
    });
    if (!exists) {
      throw new AppException(ErrorCodes.USER_NOT_FOUND, { details: { id } });
    }

    await this.prisma.users.update({
      where: { id, isDeleted: false },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: currentUser.id,
      },
    });
  }
}
