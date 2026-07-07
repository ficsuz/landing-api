import { Injectable } from '@nestjs/common';
import { ICreateRoleDto, IPermission, IRole, IUpdateRoleDto } from './interfaces/role.interface';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { PaginationDto } from '@common/dto/pagination.dto';
import { PaginatedResult } from '@common/interfaces/pagination.interface';
import { paginate } from '@common/utils/api-response.util';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { Prisma } from '@prisma/client';

const ROLE_SELECT = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  createdAt: true,
} satisfies Prisma.RolesSelect;

const PERMISSION_SELECT = {
  id: true,
  key: true,
  resource: true,
  action: true,
  description: true,
} satisfies Prisma.PermissionsSelect;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: ICreateRoleDto, user: IUserSession): Promise<IRole> {
    const existingRole = await this.prisma.roles.findFirst({
      where: {
        name: dto.name,
        isDeleted: false,
      },
    });
    if (existingRole) {
      throw new AppException(ErrorCodes.ROLE_ALREADY_EXISTS, { details: { name: dto.name } });
    }

    const role = await this.prisma.roles.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdById: user.id,
      },
      select: ROLE_SELECT,
    });

    if (dto.permissions?.length) {
      await this.replaceRolePermissions(role.id, dto.permissions, user);
    }

    return role;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<IRole>> {
    const { limit, page, search, sortBy, order } = paginationDto;

    // Build the search condition
    const where: Prisma.RolesWhereInput = search
      ? {
          isDeleted: false,
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : { isDeleted: false };

    const sort = Object.keys(ROLE_SELECT).includes(sortBy) && sortBy ? { [sortBy]: order } : {};

    // Fetch paginated roles
    const [roles, total] = await Promise.all([
      this.prisma.roles.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: ROLE_SELECT,
        orderBy: sort,
      }),
      this.prisma.roles.count({ where }),
    ]);

    return paginate(roles, total, page, limit);
  }

  async findById(id: string): Promise<IRole> {
    const role = await this.prisma.roles.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      select: ROLE_SELECT,
    });
    if (!role) {
      throw new AppException(ErrorCodes.ROLE_NOT_FOUND, { details: { id } });
    }
    return role;
  }

  async update(id: string, dto: IUpdateRoleDto, user: IUserSession): Promise<IRole> {
    const existingRole = await this.prisma.roles.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!existingRole) {
      throw new AppException(ErrorCodes.ROLE_NOT_FOUND, { details: { id } });
    }

    const role = await this.prisma.roles.update({
      where: {
        id,
      },
      data: {
        name: dto.name,
        description: dto.description,
        updatedById: user.id,
      },
      select: ROLE_SELECT,
    });

    if (dto.permissions !== undefined) {
      await this.replaceRolePermissions(id, dto.permissions, user);
    }

    return role;
  }

  async remove(id: string, user: IUserSession): Promise<void> {
    const existingRole = await this.prisma.roles.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!existingRole) {
      throw new AppException(ErrorCodes.ROLE_NOT_FOUND, { details: { id } });
    }

    // Built-in/system roles must never be deletable.
    if (existingRole.isSystem) {
      throw new AppException(ErrorCodes.INVALID_OPERATION, {
        details: { id, name: existingRole.name },
      });
    }

    await this.prisma.roles.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: user.id,
      },
    });
  }

  async assignPermissions(dto: AssignPermissionsDto, user: IUserSession): Promise<void> {
    const role = await this.prisma.roles.findFirst({
      where: { id: dto.roleId, isDeleted: false },
    });
    if (!role) {
      throw new AppException(ErrorCodes.ROLE_NOT_FOUND, { details: { id: dto.roleId } });
    }

    if (dto.permissionIds.length > 0) {
      const permissions = await this.prisma.permissions.findMany({
        where: { id: { in: dto.permissionIds } },
        select: { id: true },
      });
      if (permissions.length !== dto.permissionIds.length) {
        const found = new Set(permissions.map((permission) => permission.id));
        const notFound = dto.permissionIds.filter((permissionId) => !found.has(permissionId));
        throw new AppException(ErrorCodes.PERMISSION_NOT_FOUND, { details: { ids: notFound } });
      }
    }

    await this.replaceRolePermissions(dto.roleId, dto.permissionIds, user);
  }

  private async replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
    user: IUserSession,
  ): Promise<void> {
    await this.prisma.$transaction(async (trx: Prisma.TransactionClient) => {
      await trx.rolePermissions.deleteMany({
        where: { roleId },
      });

      if (permissionIds.length > 0) {
        await trx.rolePermissions.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
            createdById: user.id,
          })),
        });
      }
    });
  }

  async assignRolesToUser(assignRoleDto: AssignRoleDto, user: IUserSession): Promise<void> {
    const { userId, roleIds } = assignRoleDto;

    // First validate all roles exist
    const roles = await this.prisma.roles.findMany({
      where: {
        id: { in: roleIds },
        isDeleted: false,
      },
    });
    if (roles.length !== roleIds.length) {
      const notFoundRoleIds = roleIds.filter((roleId) => !roles.some((role) => role.id === roleId));
      throw new AppException(ErrorCodes.ROLE_NOT_FOUND, { details: { ids: notFoundRoleIds } });
    }

    await this.prisma.$transaction(async (trx: Prisma.TransactionClient) => {
      // Replace the user's roles wholesale.
      await trx.userRoles.deleteMany({
        where: { userId },
      });

      await trx.userRoles.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
          createdById: user.id,
        })),
      });
    });
  }

  async getUserRoles(userId: string): Promise<IRole[]> {
    const roles = await this.prisma.roles.findMany({
      where: {
        userRoles: {
          some: {
            userId,
          },
        },
        isDeleted: false,
      },
      select: ROLE_SELECT,
      orderBy: {
        id: 'asc',
      },
    });
    return roles;
  }

  async getUserPermissions(userId: string): Promise<IPermission[]> {
    // Permissions are granted exclusively through roles now.
    const permissions = await this.prisma.permissions.findMany({
      where: {
        rolePermissions: {
          some: {
            role: {
              isDeleted: false,
              userRoles: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      },
      select: PERMISSION_SELECT,
    });

    return permissions;
  }

  async userHasPermissions(userId: string, keys: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const permissionKeys = new Set(permissions.map((permission) => permission.key));

    return keys.every((key) => permissionKeys.has(key));
  }

  async listRolesWithPermissions(roleId: string): Promise<IRole> {
    const role = await this.prisma.roles.findFirst({
      where: { isDeleted: false, id: roleId },
      select: {
        ...ROLE_SELECT,
        rolePermissions: {
          select: {
            permission: {
              select: PERMISSION_SELECT,
            },
          },
        },
      },
    });

    if (!role) {
      throw new AppException(ErrorCodes.ROLE_NOT_FOUND, { details: { id: roleId } });
    }

    const { rolePermissions, ...rest } = role;
    const permissions = rolePermissions.map(({ permission }) => permission);

    return {
      ...rest,
      permissions,
    };
  }
}
