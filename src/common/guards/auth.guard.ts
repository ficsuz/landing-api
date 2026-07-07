import { ROLES_KEY } from '@common/decorators/roles.decorator';
import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '@modules/roles/roles.service';
import { ROLES } from '@common/constants';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user: IUserSession = request.user;

    if (!user) {
      throw new AppException(ErrorCodes.UNAUTHORIZED);
    }

    if (!user.isVerified) {
      throw new AppException(ErrorCodes.USER_NOT_VERIFIED);
    }

    // If neither roles nor permissions are required, allow access
    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    // Resolve the user's roles once — used both for super_admin bypass and the
    // role check below.
    const userRoles = await this.rolesService.getUserRoles(user.id);
    const userRoleNames = userRoles.map((role) => role.name.toLowerCase());
    const isSuperAdmin = userRoleNames.includes(ROLES.SUPER_ADMIN);

    // Super admin bypasses every role/permission check.
    if (isSuperAdmin) {
      return true;
    }

    // Role check: user must have at least one of the required roles.
    if (requiredRoles?.length) {
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoleNames.includes(role.toLowerCase()),
      );

      if (!hasRequiredRole) {
        throw new AppException(ErrorCodes.INSUFFICIENT_PERMISSIONS);
      }
    }

    // Permission check: user must have ALL of the required permission keys.
    if (requiredPermissions?.length) {
      const permissions = await this.rolesService.getUserPermissions(user.id);
      const permissionKeys = new Set(permissions.map((permission) => permission.key));

      const hasAllPermissions = requiredPermissions.every((permission) =>
        permissionKeys.has(permission),
      );

      if (!hasAllPermissions) {
        throw new AppException(ErrorCodes.INSUFFICIENT_PERMISSIONS);
      }
    }

    return true;
  }
}
